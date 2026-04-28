from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
from app.db.database import get_db, AsyncSessionLocal
from app.core.security import get_current_user
from app.models.models import (
    AIConversation,
    AIMemory,
    Transaction,
    Invoice,
    Document,
    Budget,
    TeamMember,
)
from app.services.ai_service import (
    generate_dashboard_insights,
    get_conversation_history,
    save_conversation_message,
    call_ai_api,
)
from app.services.memory_service import (
    get_memories,
    clear_memories,
    observe_and_update_memory,
)
from app.services.activity_service import log_activity
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Schemas ───────────────────────────────────────────────────

class AIAskRequest(BaseModel):
    question:     str
    session_id:   Optional[str]  = None
    page:         Optional[str]  = "dashboard"
    mode:         Optional[str]  = "dashboard"
    page_context: Optional[dict] = None


class AIAskResponse(BaseModel):
    reply:       str
    session_id:  str
    suggestions: list[str] = []


class AIMemoryItem(BaseModel):
    id:           str
    memory_type:  str
    memory_key:   str
    memory_value: str
    source:       str
    confidence:   float
    created_at:   Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversationMessage(BaseModel):
    id:         str
    role:       str
    content:    str
    page:       Optional[str]      = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Data builders ─────────────────────────────────────────────

async def build_dashboard_context(db: AsyncSession, user_id: str) -> str:
    try:
        txn_result   = await db.execute(select(Transaction).where(Transaction.user_id == user_id))
        transactions = txn_result.scalars().all()

        expense_txns = [t for t in transactions if (t.txn_type or "").lower() == "expense"]
        income_txns  = [t for t in transactions if (t.txn_type or "").lower() == "income"]

        total_expense = sum(float(abs(t.amount or 0)) for t in expense_txns)
        total_income  = sum(float(abs(t.amount or 0)) for t in income_txns)
        net_profit    = total_income - total_expense
        estimated_tax = max(net_profit * 0.15, 0.0)

        now          = datetime.utcnow()
        month_prefix = now.strftime("%Y-%m")

        month_income = sum(
            float(abs(t.amount or 0))
            for t in income_txns
            if str(t.txn_date or "").startswith(month_prefix)
        )
        month_expense = sum(
            float(abs(t.amount or 0))
            for t in expense_txns
            if str(t.txn_date or "").startswith(month_prefix)
        )

        category_totals: dict[str, float] = {}
        for t in expense_txns:
            category = t.category or t.ml_category or "Uncategorized"
            category_totals[category] = category_totals.get(category, 0.0) + float(abs(t.amount or 0))

        doc_result = await db.execute(select(Document).where(Document.user_id == user_id))
        documents  = doc_result.scalars().all()

        inv_result = await db.execute(select(Invoice).where(Invoice.user_id == user_id))
        invoices   = inv_result.scalars().all()

        overdue_invoices = [i for i in invoices if (i.status or "").lower() in ["overdue", "due"]]
        paid_invoices    = [i for i in invoices if (i.status or "").lower() == "paid"]
        draft_invoices   = [i for i in invoices if (i.status or "").lower() == "draft"]

        insights: list[str] = []

        if total_income == 0 and total_expense > 0:
            insights.append("You are recording expenses but no income yet, so your books may be incomplete.")
        if net_profit < 0:
            insights.append(f"Your business is currently operating at a loss of ${abs(net_profit):,.2f}.")
        if total_expense > total_income and total_income > 0:
            insights.append("Your expenses are higher than your income, which is hurting profitability.")
        if month_expense > month_income and month_income > 0:
            insights.append("This month your expenses are higher than your income, so monitor cash flow closely.")
        if category_totals:
            top_category        = max(category_totals, key=category_totals.get)
            top_category_amount = category_totals[top_category]
            insights.append(f"Your highest spending category is {top_category} at ${top_category_amount:,.2f}.")
        if overdue_invoices:
            insights.append(f"You have {len(overdue_invoices)} overdue or due invoice(s) that may need follow-up.")
        if total_income > 0 and total_expense == 0:
            insights.append("You have income recorded with no expenses, so you may still need to upload receipts or classify costs.")
        if not transactions and not invoices and not documents:
            insights.append("Your account is mostly empty right now, so the best next step is to upload a receipt, invoice, or create your first transaction.")

        lines = [
            "DASHBOARD DATA",
            f"TOTAL_REVENUE={total_income:.2f}",
            f"TOTAL_EXPENSES={total_expense:.2f}",
            f"NET_PROFIT={net_profit:.2f}",
            f"ESTIMATED_TAX_15={estimated_tax:.2f}",
            f"DOCUMENT_COUNT={len(documents)}",
            f"INVOICE_COUNT={len(invoices)}",
            f"OVERDUE_INVOICE_COUNT={len(overdue_invoices)}",
            f"PAID_INVOICE_COUNT={len(paid_invoices)}",
            f"DRAFT_INVOICE_COUNT={len(draft_invoices)}",
            f"MONTH_INCOME={month_income:.2f}",
            f"MONTH_EXPENSES={month_expense:.2f}",
            "",
            "EXPENSE_CATEGORIES",
        ]

        if category_totals:
            for category, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
                lines.append(f"{category}={amount:.2f}")
        else:
            lines.append("NONE=0.00")

        lines += ["", "SMART_INSIGHTS"]
        if insights:
            for insight in insights:
                lines.append(insight)
        else:
            lines.append("NONE")

        lines += ["", "RECENT_TRANSACTIONS"]
        recent_transactions = sorted(transactions, key=lambda x: str(x.txn_date or ""), reverse=True)[:5]
        if recent_transactions:
            for t in recent_transactions:
                lines.append(
                    f"{t.vendor or 'Unknown'} | "
                    f"{float(abs(t.amount or 0)):.2f} | "
                    f"{(t.txn_type or 'unknown').lower()} | "
                    f"{t.category or t.ml_category or 'Uncategorized'} | "
                    f"{t.txn_date or 'unknown'}"
                )
        else:
            lines.append("NONE")

        lines += ["", "INVOICES"]
        if invoices:
            recent_invoices = sorted(invoices, key=lambda x: x.created_at or datetime.utcnow(), reverse=True)[:5]
            for i in recent_invoices:
                lines.append(
                    f"{i.invoice_number or 'Unknown'} | "
                    f"{i.to_name or 'Unknown'} | "
                    f"{float(i.total or 0):.2f} | "
                    f"{(i.status or 'unknown').lower()} | "
                    f"{i.due_date or 'unknown'}"
                )
        else:
            lines.append("NONE")

        return "\n".join(lines)

    except Exception as e:
        print(f"build_dashboard_context error: {e}")
        import traceback
        traceback.print_exc()
        return "\n".join([
            "DASHBOARD DATA",
            "TOTAL_REVENUE=0.00",
            "TOTAL_EXPENSES=0.00",
            "NET_PROFIT=0.00",
            "ESTIMATED_TAX_15=0.00",
            "DOCUMENT_COUNT=0",
            "INVOICE_COUNT=0",
            "OVERDUE_INVOICE_COUNT=0",
            "PAID_INVOICE_COUNT=0",
            "DRAFT_INVOICE_COUNT=0",
            "MONTH_INCOME=0.00",
            "MONTH_EXPENSES=0.00",
            "",
            "EXPENSE_CATEGORIES",
            "NONE=0.00",
            "",
            "SMART_INSIGHTS",
            "NONE",
            "",
            "RECENT_TRANSACTIONS",
            "NONE",
            "",
            "INVOICES",
            "NONE",
        ])


async def build_transactions_context(db: AsyncSession, user_id: str) -> str:
    try:
        result       = await db.execute(select(Transaction).where(Transaction.user_id == user_id))
        transactions = result.scalars().all()
        expenses     = [t for t in transactions if (t.txn_type or "").lower() == "expense"]
        income_txns  = [t for t in transactions if (t.txn_type or "").lower() == "income"]
        uncategorized = [t for t in transactions if not t.category and not t.ml_category]

        cat_totals: dict[str, float] = {}
        for t in expenses:
            cat = t.category or t.ml_category or "Uncategorized"
            cat_totals[cat] = cat_totals.get(cat, 0) + abs(t.amount or 0)

        top_cats = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:8]

        lines = [
            "=== TRANSACTIONS CONTEXT ===",
            f"Total: {len(transactions)} | Expenses: {len(expenses)} (${sum(abs(t.amount or 0) for t in expenses):,.2f}) | Income: {len(income_txns)} (${sum(abs(t.amount or 0) for t in income_txns):,.2f}) | Uncategorized: {len(uncategorized)}",
            "",
            "ALL TRANSACTIONS:",
        ]

        for t in sorted(transactions, key=lambda x: x.txn_date or "", reverse=True):
            lines.append(
                f"- {t.vendor or 'Unknown'} | ${abs(t.amount or 0):,.2f} | "
                f"{t.txn_type or 'unknown'} | "
                f"{t.category or t.ml_category or 'Uncategorized'} | "
                f"{t.txn_date or '?'}"
            )

        lines += ["", "TOP EXPENSE CATEGORIES:"]
        for cat, amt in top_cats:
            lines.append(f"- {cat}: ${amt:,.2f}")

        lines.append("=== END TRANSACTIONS CONTEXT ===")
        return "\n".join(lines)
    except Exception as e:
        return f"Transactions context error: {e}"


async def build_documents_context(db: AsyncSession, user_id: str) -> str:
    try:
        result    = await db.execute(select(Document).where(Document.user_id == user_id))
        documents = result.scalars().all()

        paid_docs    = [d for d in documents if (getattr(d, 'payment_status', None) or 'paid') == 'paid']
        due_docs     = [d for d in documents if (getattr(d, 'payment_status', None) or '') == 'due']
        overdue_docs = [d for d in documents if (getattr(d, 'payment_status', None) or '') == 'overdue']
        total_due    = sum(float(d.total_amount or 0) for d in due_docs + overdue_docs)

        lines = [
            "=== DOCUMENTS CONTEXT ===",
            f"Total: {len(documents)} | "
            f"Processed: {sum(1 for d in documents if (d.status or '').lower() == 'processed')} | "
            f"Review needed: {sum(1 for d in documents if (d.status or '').lower() == 'review')} | "
            f"With amounts: {sum(1 for d in documents if (d.total_amount or 0) > 0)}",
            f"Payment summary: Paid={len(paid_docs)} | Due={len(due_docs)} | "
            f"Overdue={len(overdue_docs)} | Total outstanding=${total_due:,.2f}",
            "",
            "ALL DOCUMENTS:",
        ]

        for d in sorted(documents, key=lambda x: x.uploaded_at or datetime.utcnow(), reverse=True):
            payment_status = getattr(d, 'payment_status', None) or 'paid'
            doc_type       = getattr(d, 'doc_type', None) or 'receipt'
            client         = getattr(d, 'client_name', None) or ''
            lines.append(
                f"- {d.filename} | "
                f"vendor:{d.vendor or 'Unknown'} | "
                f"client:{client or 'N/A'} | "
                f"${d.total_amount or 0:,.2f} | "
                f"type:{doc_type} | "
                f"processing:{d.status or 'unknown'} | "
                f"payment:{payment_status} | "
                f"date:{d.doc_date or '?'}"
            )

        lines += [
            "",
            "PAYMENT STATUS RULES:",
            "- 'processed' means AI finished reading the document. It does NOT mean payment is complete.",
            "- 'payment:paid' means the invoice or receipt has been paid.",
            "- 'payment:due' means an invoice is awaiting payment.",
            "- 'payment:overdue' means an invoice is past its due date and unpaid.",
            "- receipts are always payment:paid because the user already paid them.",
            "- invoice_sent documents start as payment:due until marked paid.",
            "=== END DOCUMENTS CONTEXT ===",
        ]

        return "\n".join(lines)
    except Exception as e:
        return f"Documents context error: {e}"


async def build_invoices_context(db: AsyncSession, user_id: str) -> str:
    try:
        result   = await db.execute(select(Invoice).where(Invoice.user_id == user_id))
        invoices = result.scalars().all()

        overdue = [i for i in invoices if (i.status or "").lower() in ["overdue", "due"]]
        paid    = [i for i in invoices if (i.status or "").lower() == "paid"]
        draft   = [i for i in invoices if (i.status or "").lower() == "draft"]

        lines = [
            "=== INVOICES CONTEXT ===",
            f"Total: {len(invoices)} | Paid: {len(paid)} (${sum(i.total or 0 for i in paid):,.2f}) | Overdue/Due: {len(overdue)} (${sum(i.total or 0 for i in overdue):,.2f}) | Draft: {len(draft)}",
            "",
            "ALL INVOICES:",
        ]

        for i in sorted(invoices, key=lambda x: x.created_at or datetime.utcnow(), reverse=True):
            lines.append(
                f"- #{i.invoice_number or 'N/A'} | "
                f"to:{i.to_name or 'Unknown'} | "
                f"${i.total or 0:,.2f} | "
                f"{i.status or 'unknown'} | "
                f"due:{i.due_date or '?'}"
            )

        lines.append("=== END INVOICES CONTEXT ===")
        return "\n".join(lines)
    except Exception as e:
        return f"Invoices context error: {e}"


async def build_tax_context(db: AsyncSession, user_id: str) -> str:
    try:
        txn_result   = await db.execute(select(Transaction).where(Transaction.user_id == user_id))
        transactions = txn_result.scalars().all()

        expenses    = [t for t in transactions if (t.txn_type or "").lower() == "expense"]
        income_txns = [t for t in transactions if (t.txn_type or "").lower() == "income"]

        total_exp = sum(abs(t.amount or 0) for t in expenses)
        total_inc = sum(abs(t.amount or 0) for t in income_txns)

        inv_result = await db.execute(select(Invoice).where(Invoice.user_id == user_id))
        invoices   = inv_result.scalars().all()
        inv_income = sum(i.total or 0 for i in invoices if (i.status or "").lower() == "paid")

        total_income = total_inc + inv_income
        profit       = total_income - total_exp

        cat_totals: dict[str, float] = {}
        for t in expenses:
            cat = t.category or t.ml_category or "Uncategorized"
            cat_totals[cat] = cat_totals.get(cat, 0) + abs(t.amount or 0)

        deductible_categories = [
            "software & saas", "office supplies", "transportation",
            "professional services", "rent & facilities", "utilities",
            "marketing", "hardware & equipment", "insurance",
        ]

        deductible_total = sum(
            amt for cat, amt in cat_totals.items()
            if cat.lower() in deductible_categories
        )

        lines = [
            "=== TAX CONTEXT ===",
            f"Total income: ${total_income:,.2f}",
            f"Total expenses: ${total_exp:,.2f}",
            f"Net profit: ${profit:,.2f}",
            f"Tax at 15%: ${max(profit * 0.15, 0):,.2f}",
            f"Tax at 20%: ${max(profit * 0.20, 0):,.2f}",
            f"Tax at 25%: ${max(profit * 0.25, 0):,.2f}",
            f"Potentially deductible: ${deductible_total:,.2f}",
            "",
            "EXPENSE BREAKDOWN:",
        ]

        for cat, amt in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True):
            tag = "✓ deductible" if cat.lower() in deductible_categories else ""
            lines.append(f"- {cat}: ${amt:,.2f} {tag}")

        lines.append("=== END TAX CONTEXT ===")
        return "\n".join(lines)
    except Exception as e:
        return f"Tax context error: {e}"


async def build_team_context(db: AsyncSession, user_id: str) -> str:
    try:
        result  = await db.execute(select(TeamMember).where(TeamMember.owner_id == user_id))
        members = result.scalars().all()

        by_role: dict[str, list] = {}
        for m in members:
            role = m.role or "unknown"
            by_role.setdefault(role, []).append(m)

        lines = [
            "=== TEAM CONTEXT ===",
            f"Total: {len(members)} | Active: {sum(1 for m in members if (m.status or '').lower() == 'active')} | Pending: {sum(1 for m in members if (m.status or '').lower() == 'pending')}",
            "",
            "MEMBERS BY ROLE:",
        ]

        for role, role_members in by_role.items():
            lines.append(f"{role.upper()} ({len(role_members)}):")
            for m in role_members:
                invited = m.invited_at.strftime("%Y-%m-%d") if m.invited_at else "?"
                lines.append(
                    f"  - {m.full_name or 'Unnamed'} ({m.email or 'no-email'}) | "
                    f"{m.status or 'unknown'} | invited:{invited}"
                )

        lines.append("=== END TEAM CONTEXT ===")
        return "\n".join(lines)
    except Exception as e:
        return f"Team context error: {e}"


async def build_vendors_context(db: AsyncSession, user_id: str) -> str:
    try:
        result       = await db.execute(select(Transaction).where(Transaction.user_id == user_id))
        transactions = result.scalars().all()

        vendor_totals: dict[str, dict] = {}
        for t in transactions:
            vendor = t.vendor or "Unknown"
            if vendor not in vendor_totals:
                vendor_totals[vendor] = {"total": 0.0, "count": 0, "type": t.txn_type or "unknown"}
            vendor_totals[vendor]["total"] += abs(t.amount or 0)
            vendor_totals[vendor]["count"] += 1

        top_vendors = sorted(vendor_totals.items(), key=lambda x: x[1]["total"], reverse=True)[:15]

        lines = [
            "=== VENDORS CONTEXT ===",
            f"Unique vendors: {len(vendor_totals)} | Total transactions: {len(transactions)}",
            "",
            "TOP VENDORS BY SPEND:",
        ]

        for vendor, data in top_vendors:
            lines.append(f"- {vendor}: ${data['total']:,.2f} ({data['count']} transactions)")

        lines.append("=== END VENDORS CONTEXT ===")
        return "\n".join(lines)
    except Exception as e:
        return f"Vendors context error: {e}"


async def build_context_for_mode(db: AsyncSession, user_id: str, mode: str) -> str:
    builders = {
        "dashboard":    build_dashboard_context,
        "transactions": build_transactions_context,
        "documents":    build_documents_context,
        "invoices":     build_invoices_context,
        "tax":          build_tax_context,
        "team":         build_team_context,
        "vendors":      build_vendors_context,
        "budgets":      build_dashboard_context,
        "scanner":      build_documents_context,
        "integrations": build_dashboard_context,
        "agents":       build_dashboard_context,
        "currency":     build_dashboard_context,
    }
    builder = builders.get(mode, build_dashboard_context)
    return await builder(db, user_id)


# ── Prompt helpers ────────────────────────────────────────────

def _has_usable_real_data(real_data: str) -> bool:
    if not real_data:
        return False
    lowered = real_data.lower().strip()
    if lowered == "":
        return False
    if "context error" in lowered:
        return False
    if "dashboard context error" in lowered:
        return False
    return True


def build_effective_user_message(question: str, mode: str, real_data: str) -> str:
    clean_question = (question or "").strip()

    if mode == "dashboard" and _has_usable_real_data(real_data):
        return f"""{clean_question}

DASHBOARD DATA:
{real_data}
"""
    if mode != "dashboard" and _has_usable_real_data(real_data):
        return f"""{clean_question}

REAL PAGE DATA:
{real_data}
"""
    return clean_question


# ── System prompts ────────────────────────────────────────────

def get_system_prompt(mode: str, real_data: str) -> str:
    base_rules = """
CRITICAL BEHAVIOR RULES:
1. Answer ALL questions related to this page. Never redirect valid page questions.
2. You are a product expert. Explain how features work even when there is no data.
3. Never say "No data recorded yet" as a complete answer — always explain the feature first, then mention no data exists yet.
4. NEVER say "That is a broader question" for any page-related question.
5. Only redirect to Dashboard AI for questions about full cross-app financial summaries.
6. Keep answers concise, clear, and helpful.
7. Never refuse a valid question about this page.
8. Never invent numbers that are not in the provided real data.
9. Never expose raw labels like TOTAL_REVENUE, DASHBOARD DATA, SMART_INSIGHTS, or RECENT_TRANSACTIONS in the final answer.
"""

    prompts = {
        "dashboard": f"""
You are LedgerFlow's Executive Finance Copilot.

You are an intelligent assistant that helps users with:
1. Financial insights based on real data
2. Business advice and decision-making
3. Explaining LedgerFlow features and value

CORE RULES:
1. Use ONLY the real data provided — do NOT invent numbers.
2. Give clear, actionable insights.
3. Provide smart, practical business advice.
4. Always be clear and confident.
5. Keep responses concise with next steps.

REAL DATA:
{real_data}
""",
        "transactions": f"""
You are LedgerFlow's Transaction Analyst.

YOU KNOW HOW TRANSACTIONS WORK:
- Documents uploaded automatically create transactions
- Receipts usually become expense transactions
- Income invoices usually become income transactions
- Each transaction includes date, vendor, amount, type, and category
- Users can filter transactions and edit categories
- CSV import is supported

{base_rules}

REAL DATA:
{real_data}
""",
       "documents": f"""
You are LedgerFlow's Document Extraction and Payment Assistant.

YOU KNOW HOW DOCUMENTS AND PAYMENT STATUS WORK:

EXPENSE DOCUMENTS:
- These are documents where the USER paid money OUT.
- Examples: receipts, bills, invoices received from vendors.
- When a user uploads an expense document, it means they already paid it.
- So expense documents always show payment status = PAID.
- The user spent this money. It is gone. It is paid.
- Example: user buys office supplies → uploads receipt → shows [Processed] [Paid]

INCOME DOCUMENTS:
- These are documents where the USER is owed money or received money.
- Examples: invoices the user sent to clients, payment confirmations received.
- When a user uploads an income document, the system checks if it has been paid or not.
- If the invoice shows it was paid → payment status = PAID
- If the invoice is still outstanding → payment status = DUE
- If the due date has passed and not paid → payment status = OVERDUE
- The AI reads the document and determines this automatically from the content.
- Example: user sends invoice to client for $500 → uploads it → shows [Processed] [Due] until client pays
- Example: user receives payment confirmation → uploads it → shows [Processed] [Paid]

HOW TO EXPLAIN THIS TO USERS:
- "Expense = money you spent = always Paid"
- "Income = money owed to you = Due until you mark it Paid"
- "The AI reads your document and sets the payment status automatically based on the content"
- "If the invoice PDF contains words like Paid, Payment Received, or Balance $0, the AI sets it to Paid automatically"
- "If no payment confirmation is found in the document, income defaults to Due until marked paid manually"
- "You can manually mark an invoice as Paid using the green Paid button in the Actions column"

YOU UNDERSTAND TWO SEPARATE STATUSES:
1. PROCESSING STATUS — did the AI finish reading the document?
   - processed = AI successfully extracted data (does NOT mean payment is done)
   - review = AI needs human review
   - pending = still being processed
   - failed = extraction failed

2. PAYMENT STATUS — has money actually changed hands?
   - paid = money was paid or spent (expenses are always paid, income is paid when confirmed)
   - due = income invoice is awaiting payment from client
   - overdue = income invoice is past due date and still unpaid
   - partially_paid = invoice partially settled

CRITICAL RULES:
- NEVER say "Processed" means paid. They are completely separate.
- A document can be [Processed] AND [Due] at the same time — processed means AI read it, due means payment is still pending.
- Expense documents = user spent money = always PAID.
- Income documents = user is owed money = DUE until paid.
- When user asks "why does my invoice show Due?" — explain that the client has not paid yet and they can click Mark as Paid when payment is received.
- When user asks "why does my receipt show Paid?" — explain that receipts are expenses the user already paid.
- If a user asks how to mark something as paid, tell them to click the green "Paid" button in the Actions column on the document row.

{base_rules}

REAL DATA:
{real_data}
""",
        "invoices": f"""
You are LedgerFlow's Billing and Receivables Assistant.

YOU KNOW HOW INVOICES WORK:
- Invoices can be created manually or from documents
- Statuses include draft, sent, due, paid, and overdue
- Users can mark invoices as paid
- PDF export is available

{base_rules}

REAL DATA:
{real_data}
""",
        "tax": f"""
You are LedgerFlow's Tax Preparation Assistant.

YOU KNOW HOW THE TAX CALCULATOR WORKS:
- Users can estimate tax from revenue and deductible expenses
- Taxable income is generally income minus expenses
- Tax can be estimated using a selected rate

{base_rules}

REAL DATA:
{real_data}
""",
        "team": f"""
You are LedgerFlow's Team Access and Permissions Assistant.

YOU KNOW HOW ROLES AND PERMISSIONS WORK:
- Admin has full access
- Accountant can manage financial records
- Staff has limited operational access
- Viewer has read-only access

{base_rules}

REAL DATA:
{real_data}
""",
        "vendors": f"""
You are LedgerFlow's Vendor Analytics Assistant.

YOU KNOW HOW VENDOR ANALYTICS WORK:
- Transactions are grouped by vendor
- Users can review top vendors by spend
- Vendor patterns help users understand repeat spending

{base_rules}

REAL DATA:
{real_data}
""",
        "budgets": f"""
You are LedgerFlow's Budget Management Assistant.

YOU ONLY ANSWER BUDGET-RELATED QUESTIONS.
If a user asks about invoices, documents, transactions, or other pages,
politely say: "I can help with budget-related questions on this page.
Please go to the related page for that information."

YOU KNOW HOW BUDGETS WORK:
- Users can set monthly spending limits per category
- The app compares actual spending against those limits
- Budgets can be under target, near limit, or exceeded
- Users can manually override the spent amount
- Categories with no transactions show $0 spent

{base_rules}

REAL DATA:
{real_data}
""",
        "scanner": f"""
You are LedgerFlow's Receipt Scanner Assistant.

YOU KNOW HOW RECEIPT SCANNING WORKS:
- Users upload receipt images
- OCR extracts vendor, date, amount, tax, and category suggestions
- Users can review and save the result into their books

{base_rules}

REAL DATA:
{real_data}
""",
        "integrations": f"""
You are LedgerFlow's Integrations Assistant.

YOU KNOW HOW INTEGRATIONS WORK:
- QuickBooks and Xero can sync accounting records
- Stripe can sync payment activity
- Connected means active; offline means not connected

{base_rules}

REAL DATA:
{real_data}
""",
        "currency": f"""
You are LedgerFlow's Currency Assistant.

YOU KNOW HOW CURRENCY WORKS:
- Users can work in multiple currencies
- The app stores base-currency reporting
- Conversions affect invoices, transactions, and reporting

{base_rules}

REAL DATA:
{real_data}
""",
    }

    return prompts.get(mode, prompts["dashboard"])


# ── POST /ai/ask ──────────────────────────────────────────────

@router.post("/ask", response_model=AIAskResponse)
async def ask_ai(
    request:      AIAskRequest,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    user_id = str(current_user.id)
    mode    = request.mode or request.page or "dashboard"

    real_data = ""
    try:
        async with AsyncSessionLocal() as fresh_db:
            real_data = await build_context_for_mode(fresh_db, user_id, mode)
            print("========== REAL DATA SENT TO AI ==========")
            print(real_data)
            print("=========================================")
    except Exception as e:
        print(f"build_context_for_mode error: {e}")
        import traceback
        traceback.print_exc()
        real_data = ""

    system_prompt = get_system_prompt(mode, real_data)

    if mode == "dashboard":
        session_id = str(uuid.uuid4())
        history    = []
    else:
        session_id = request.session_id or str(uuid.uuid4())
        try:
            async with AsyncSessionLocal() as fresh_db2:
                history = await get_conversation_history(fresh_db2, user_id, session_id)
        except Exception:
            history = []

    user_message = build_effective_user_message(request.question, mode, real_data)

    messages = (
        [{"role": "system", "content": system_prompt}]
        + history
        + [{"role": "user", "content": user_message}]
    )

    try:
        await save_conversation_message(
            db, user_id, session_id,
            role="user",
            content=request.question,
            page=request.page,
            context_snapshot={
                "mode":      mode,
                "real_data": real_data[:4000] if real_data else "",
            },
        )
    except Exception as e:
        print(f"Save user message error (non-fatal): {e}")
        try:
            await db.rollback()
        except Exception:
            pass

    tokens_used = None
    try:
        reply, tokens_used = await call_ai_api(messages)
    except Exception as e:
        print(f"AI call failed: {e}")
        reply = "I am having trouble connecting right now. Please try again."

    try:
        await save_conversation_message(
            db, user_id, session_id,
            role="assistant",
            content=reply,
            page=request.page,
            context_snapshot={"mode": mode},
            tokens_used=tokens_used,
        )
    except Exception as e:
        print(f"Save assistant message error (non-fatal): {e}")
        try:
            await db.rollback()
        except Exception:
            pass

    try:
        await log_activity(
            db, user_id,
            action_type="ai_question_asked",
            page=request.page,
            action_data={
                "question":    request.question[:100],
                "mode":        mode,
                "tokens_used": tokens_used,
            },
        )
    except Exception as e:
        print(f"Activity log error: {e}")

    return AIAskResponse(
        reply=reply,
        session_id=session_id,
        suggestions=[],
    )


# ── GET /ai/history ───────────────────────────────────────────

@router.get("/history")
async def get_ai_history(
    limit:        int           = 50,
    session_id:   Optional[str] = None,
    current_user=Depends(get_current_user),
    db:           AsyncSession  = Depends(get_db),
):
    user_id = str(current_user.id)
    query   = select(AIConversation).where(AIConversation.user_id == user_id)

    if session_id:
        query = query.where(AIConversation.session_id == session_id)

    query         = query.order_by(desc(AIConversation.created_at)).limit(limit)
    result        = await db.execute(query)
    conversations = result.scalars().all()
    return list(reversed(conversations))


# ── DELETE /ai/history ────────────────────────────────────────

@router.delete("/history")
async def clear_ai_history(
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    await db.execute(delete(AIConversation).where(AIConversation.user_id == user_id))
    await db.commit()
    return {"message": "Conversation history cleared"}


# ── GET /ai/memory ────────────────────────────────────────────

@router.get("/memory")
async def get_ai_memory(
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    return await get_memories(db, user_id)


# ── DELETE /ai/memory ─────────────────────────────────────────

@router.delete("/memory")
async def clear_ai_memory(
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    await clear_memories(db, user_id)
    return {"message": "AI memory cleared"}


# ── POST /ai/memory/refresh ───────────────────────────────────

@router.post("/memory/refresh")
async def refresh_ai_memory(
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    user_id  = str(current_user.id)
    await observe_and_update_memory(db, user_id)
    memories = await get_memories(db, user_id)
    return {"message": "AI memory refreshed", "memory_count": len(memories)}


# ── GET /ai/insights ──────────────────────────────────────────

@router.get("/insights")
async def get_dashboard_insights(
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    user_id   = str(current_user.id)
    real_data = await build_dashboard_context(db, user_id)
    insights  = await generate_dashboard_insights(db, user_id, real_data=real_data)
    return {"insights": insights}


# ── GET /ai/suggestions ───────────────────────────────────────

@router.get("/suggestions")
async def get_page_suggestions(
    page:         str          = "dashboard",
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    return {"suggestions": []}