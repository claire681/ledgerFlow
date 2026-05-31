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

async def build_dashboard_context(
    db: AsyncSession,
    user_id: str
) -> str:
    try:
        from datetime import timedelta

        txn_result = await db.execute(
            select(Transaction).where(Transaction.user_id == user_id)
        )
        transactions = txn_result.scalars().all()

        doc_result = await db.execute(
            select(Document).where(Document.user_id == user_id)
        )
        documents = doc_result.scalars().all()

        inv_result = await db.execute(
            select(Invoice).where(Invoice.user_id == user_id)
        )
        invoices = inv_result.scalars().all()

        now = datetime.utcnow()
        today_str = now.strftime("%Y-%m-%d")
        this_month = now.strftime("%Y-%m")
        last_month_dt = now.replace(day=1) - timedelta(days=1)
        last_month = last_month_dt.strftime("%Y-%m")
        this_year = now.strftime("%Y")

        def in_month(t, m):
            return str(t.txn_date or "").startswith(m)

        def in_year(t, y):
            return str(t.txn_date or "").startswith(y)

        def in_last_n_days(t, n):
            d = str(t.txn_date or "")[:10]
            if not d:
                return False
            try:
                td = datetime.strptime(d, "%Y-%m-%d")
                return (now - td).days <= n
            except Exception:
                return False

        expense_txns = [t for t in transactions if (t.txn_type or "").lower() == "expense"]
        income_txns = [t for t in transactions if (t.txn_type or "").lower() == "income"]

        total_expense = sum(float(abs(t.amount or 0)) for t in expense_txns)
        total_income = sum(float(abs(t.amount or 0)) for t in income_txns)
        net_profit = total_income - total_expense
        estimated_tax = max(net_profit * 0.15, 0.0)

        month_expense_txns = [t for t in expense_txns if in_month(t, this_month)]
        month_income_txns = [t for t in income_txns if in_month(t, this_month)]
        month_expense = sum(float(abs(t.amount or 0)) for t in month_expense_txns)
        month_income = sum(float(abs(t.amount or 0)) for t in month_income_txns)

        last_month_expense_txns = [t for t in expense_txns if in_month(t, last_month)]
        last_month_income_txns = [t for t in income_txns if in_month(t, last_month)]
        last_month_expense = sum(float(abs(t.amount or 0)) for t in last_month_expense_txns)
        last_month_income = sum(float(abs(t.amount or 0)) for t in last_month_income_txns)

        ytd_expense = sum(float(abs(t.amount or 0)) for t in expense_txns if in_year(t, this_year))
        ytd_income = sum(float(abs(t.amount or 0)) for t in income_txns if in_year(t, this_year))

        last_90d_exp = [t for t in expense_txns if in_last_n_days(t, 90)]
        last_90d_inc = [t for t in income_txns if in_last_n_days(t, 90)]
        avg_monthly_exp = (sum(abs(t.amount or 0) for t in last_90d_exp) / 3.0) if last_90d_exp else 0.0
        avg_monthly_inc = (sum(abs(t.amount or 0) for t in last_90d_inc) / 3.0) if last_90d_inc else 0.0

        category_totals: dict[str, float] = {}
        for t in expense_txns:
            category = t.category or t.ml_category or "Uncategorized"
            category_totals[category] = category_totals.get(category, 0.0) + float(abs(t.amount or 0))
        top_cats = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]

        overdue_invoices = [i for i in invoices if (i.status or "").lower() in ["overdue", "due"]]
        paid_invoices = [i for i in invoices if (i.status or "").lower() == "paid"]
        draft_invoices = [i for i in invoices if (i.status or "").lower() == "draft"]
        outstanding = sum(float(i.total or 0) for i in overdue_invoices)

        insights: list[str] = []
        if total_income == 0 and total_expense > 0:
            insights.append("Expenses recorded but no income yet — books may be incomplete.")
        if net_profit < 0:
            insights.append(f"Currently operating at a loss of ${abs(net_profit):,.2f}.")
        if month_expense > month_income and month_income > 0:
            insights.append("This month expenses exceed income — monitor cash flow.")
        if avg_monthly_exp > 0 and month_expense > avg_monthly_exp * 1.5:
            insights.append(f"This month's spending (${month_expense:,.2f}) is significantly above your 3-month average (${avg_monthly_exp:,.2f}).")
        if top_cats:
            top_cat, top_amt = top_cats[0]
            insights.append(f"Highest spending category: {top_cat} at ${top_amt:,.2f} all-time.")
        if overdue_invoices:
            insights.append(f"{len(overdue_invoices)} invoice(s) overdue/due (${outstanding:,.2f} outstanding).")
        if not transactions and not invoices and not documents:
            insights.append("Account is mostly empty — upload a receipt or add a transaction to begin.")

        lines = [
            "DASHBOARD DATA",
            f"TODAY={today_str}",
            f"CURRENT_MONTH={this_month}",
            f"PREVIOUS_MONTH={last_month}",
            f"CURRENT_YEAR={this_year}",
            "",
            "## ALL-TIME",
            f"TOTAL_REVENUE={total_income:.2f}",
            f"TOTAL_EXPENSES={total_expense:.2f}",
            f"NET_PROFIT={net_profit:.2f}",
            f"ESTIMATED_TAX_15={estimated_tax:.2f}",
            f"DOCUMENT_COUNT={len(documents)}",
            f"INVOICE_COUNT={len(invoices)}",
            f"TRANSACTION_COUNT={len(transactions)}",
            "",
            f"## THIS MONTH ({this_month}, through {today_str})",
            f"MONTH_INCOME={month_income:.2f}",
            f"MONTH_EXPENSE={month_expense:.2f}",
            f"MONTH_NET={month_income - month_expense:.2f}",
            f"MONTH_EXPENSE_COUNT={len(month_expense_txns)}",
            f"MONTH_INCOME_COUNT={len(month_income_txns)}",
            "",
            f"## PREVIOUS MONTH ({last_month})",
            f"LAST_MONTH_INCOME={last_month_income:.2f}",
            f"LAST_MONTH_EXPENSE={last_month_expense:.2f}",
            f"LAST_MONTH_NET={last_month_income - last_month_expense:.2f}",
            "",
            f"## YEAR-TO-DATE ({this_year})",
            f"YTD_INCOME={ytd_income:.2f}",
            f"YTD_EXPENSE={ytd_expense:.2f}",
            f"YTD_NET={ytd_income - ytd_expense:.2f}",
            "",
            "## TRENDS (LAST 3 MONTHS)",
            f"AVG_MONTHLY_INCOME={avg_monthly_inc:.2f}",
            f"AVG_MONTHLY_EXPENSE={avg_monthly_exp:.2f}",
            "",
            "## INVOICE STATUS",
            f"OVERDUE_COUNT={len(overdue_invoices)}",
            f"OUTSTANDING_AMOUNT={outstanding:.2f}",
            f"PAID_COUNT={len(paid_invoices)}",
            f"DRAFT_COUNT={len(draft_invoices)}",
            "",
            "## TOP EXPENSE CATEGORIES (ALL-TIME)",
        ]
        for cat, amt in top_cats:
            lines.append(f"- {cat}: ${amt:,.2f}")

        lines += ["", "## SMART INSIGHTS"]
        for ins in insights:
            lines.append(f"- {ins}")

        return "\n".join(lines)

    except Exception as e:
        return f"Dashboard context error: {e}"


async def build_transactions_context(db: AsyncSession, user_id: str) -> str:
    try:
        from datetime import timedelta
        result = await db.execute(
            select(Transaction).where(Transaction.user_id == user_id)
        )
        transactions = result.scalars().all()

        now = datetime.utcnow()
        today_str = now.strftime("%Y-%m-%d")
        this_month = now.strftime("%Y-%m")
        last_month_dt = now.replace(day=1) - timedelta(days=1)
        last_month = last_month_dt.strftime("%Y-%m")

        def in_month(t, m):
            return str(t.txn_date or "").startswith(m)

        def in_last_n_days(t, n):
            d = str(t.txn_date or "")[:10]
            if not d:
                return False
            try:
                td = datetime.strptime(d, "%Y-%m-%d")
                return (now - td).days <= n
            except Exception:
                return False

        expenses = [t for t in transactions if (t.txn_type or "").lower() == "expense"]
        income_txns = [t for t in transactions if (t.txn_type or "").lower() == "income"]
        uncategorized = [t for t in transactions if not t.category and not t.ml_category]

        this_month_exp = [t for t in expenses if in_month(t, this_month)]
        last_month_exp = [t for t in expenses if in_month(t, last_month)]
        this_month_inc = [t for t in income_txns if in_month(t, this_month)]
        last_month_inc = [t for t in income_txns if in_month(t, last_month)]

        last_90d_exp = [t for t in expenses if in_last_n_days(t, 90)]
        last_90d_inc = [t for t in income_txns if in_last_n_days(t, 90)]
        avg_monthly_exp = (sum(abs(t.amount or 0) for t in last_90d_exp) / 3.0) if last_90d_exp else 0.0
        avg_monthly_inc = (sum(abs(t.amount or 0) for t in last_90d_inc) / 3.0) if last_90d_inc else 0.0

        cat_totals = {}
        for t in expenses:
            cat = t.category or t.ml_category or "Uncategorized"
            cat_totals[cat] = cat_totals.get(cat, 0) + abs(t.amount or 0)
        top_cats = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:8]

        lines = [
            "=== TRANSACTIONS CONTEXT ===",
            f"TODAY: {today_str}",
            f"CURRENT_MONTH: {this_month}",
            f"PREVIOUS_MONTH: {last_month}",
            "",
            "## OVERVIEW (ALL-TIME)",
            f"Total transactions: {len(transactions)}",
            f"Expenses: {len(expenses)} totalling ${sum(abs(t.amount or 0) for t in expenses):,.2f}",
            f"Income: {len(income_txns)} totalling ${sum(abs(t.amount or 0) for t in income_txns):,.2f}",
            f"Uncategorized: {len(uncategorized)}",
            "",
            f"## THIS MONTH ({this_month}, through {today_str})",
            f"Expenses: {len(this_month_exp)} totalling ${sum(abs(t.amount or 0) for t in this_month_exp):,.2f}",
            f"Income: {len(this_month_inc)} totalling ${sum(abs(t.amount or 0) for t in this_month_inc):,.2f}",
        ]

        if this_month_exp:
            biggest = max(this_month_exp, key=lambda x: abs(x.amount or 0))
            lines.append(
                f"Biggest expense this month: ${abs(biggest.amount or 0):,.2f} "
                f"at {biggest.vendor or 'Unknown'} on {biggest.txn_date or '?'} "
                f"({biggest.category or biggest.ml_category or 'Uncategorized'})"
            )
        else:
            lines.append("No expenses recorded this month yet.")

        lines += [
            "",
            f"## PREVIOUS MONTH ({last_month})",
            f"Expenses: {len(last_month_exp)} totalling ${sum(abs(t.amount or 0) for t in last_month_exp):,.2f}",
            f"Income: {len(last_month_inc)} totalling ${sum(abs(t.amount or 0) for t in last_month_inc):,.2f}",
        ]

        if last_month_exp:
            biggest_lm = max(last_month_exp, key=lambda x: abs(x.amount or 0))
            lines.append(
                f"Biggest expense last month: ${abs(biggest_lm.amount or 0):,.2f} "
                f"at {biggest_lm.vendor or 'Unknown'}"
            )

        lines += [
            "",
            "## TRENDS (LAST 3 MONTHS, FOR COMPARISON)",
            f"Average monthly expense: ${avg_monthly_exp:,.2f}",
            f"Average monthly income: ${avg_monthly_inc:,.2f}",
            "(Use these averages to judge whether the current month is normal, high, or low.)",
            "",
            "## TOP EXPENSE CATEGORIES (ALL-TIME)",
        ]
        for cat, amt in top_cats:
            lines.append(f"- {cat}: ${amt:,.2f}")

        lines += ["", "## RECENT TRANSACTIONS (last 25, most recent first)"]
        for t in sorted(transactions, key=lambda x: x.txn_date or "", reverse=True)[:25]:
            lines.append(
                f"- {t.txn_date or '?'} | {t.vendor or 'Unknown'} | "
                f"${abs(t.amount or 0):,.2f} | {t.txn_type or 'unknown'} | "
                f"{t.category or t.ml_category or 'Uncategorized'}"
            )

        lines.append("=== END TRANSACTIONS CONTEXT ===")
        return "\n".join(lines)

    except Exception as e:
        return f"Transactions context error: {e}"


async def build_documents_context(db: AsyncSession, user_id: str) -> str:
    try:
        from datetime import timedelta
        result = await db.execute(
            select(Document).where(Document.user_id == user_id)
        )
        documents = result.scalars().all()

        now = datetime.utcnow()
        today_str = now.strftime("%Y-%m-%d")
        this_month = now.strftime("%Y-%m")
        last_month_dt = now.replace(day=1) - timedelta(days=1)
        last_month = last_month_dt.strftime("%Y-%m")

        def uploaded_in(d, m):
            ua = getattr(d, 'uploaded_at', None)
            if ua is None:
                return False
            return str(ua).startswith(m)

        paid_docs = [d for d in documents if (getattr(d, 'payment_status', None) or 'paid') == 'paid']
        due_docs = [d for d in documents if (getattr(d, 'payment_status', None) or '') == 'due']
        overdue_docs = [d for d in documents if (getattr(d, 'payment_status', None) or '') == 'overdue']

        total_due = sum(float(d.total_amount or 0) for d in due_docs + overdue_docs)
        total_paid_value = sum(float(d.total_amount or 0) for d in paid_docs)

        processed = [d for d in documents if (d.status or '').lower() == 'processed']
        needs_review = [d for d in documents if (d.status or '').lower() == 'review']
        no_amount = [d for d in documents if not (d.total_amount or 0) > 0]

        this_month_docs = [d for d in documents if uploaded_in(d, this_month)]
        last_month_docs = [d for d in documents if uploaded_in(d, last_month)]

        vendor_totals: dict[str, float] = {}
        for d in documents:
            v = d.vendor or 'Unknown'
            vendor_totals[v] = vendor_totals.get(v, 0) + float(d.total_amount or 0)
        top_vendors = sorted(vendor_totals.items(), key=lambda x: x[1], reverse=True)[:8]

        lines = [
            "=== DOCUMENTS CONTEXT ===",
            f"TODAY: {today_str}",
            f"CURRENT_MONTH: {this_month}",
            "",
            "## SUMMARY",
            f"Total documents: {len(documents)}",
            f"Processed: {len(processed)}",
            f"Needs review: {len(needs_review)}",
            f"Missing amount: {len(no_amount)}",
            "",
            "## PAYMENT STATUS",
            f"Paid: {len(paid_docs)} (${total_paid_value:,.2f})",
            f"Due: {len(due_docs)}",
            f"Overdue: {len(overdue_docs)}",
            f"Outstanding (due + overdue): ${total_due:,.2f}",
            "",
            f"## THIS MONTH ({this_month})",
            f"Uploaded this month: {len(this_month_docs)}",
            f"Total amount: ${sum(float(d.total_amount or 0) for d in this_month_docs):,.2f}",
            "",
            f"## LAST MONTH ({last_month})",
            f"Uploaded last month: {len(last_month_docs)}",
            f"Total amount: ${sum(float(d.total_amount or 0) for d in last_month_docs):,.2f}",
            "",
            "## TOP VENDORS BY SPEND",
        ]
        for v, amt in top_vendors:
            lines.append(f"- {v}: ${amt:,.2f}")

        lines += ["", "## RECENT DOCUMENTS (last 30)"]
        for d in sorted(documents, key=lambda x: x.uploaded_at or datetime.utcnow(), reverse=True)[:30]:
            payment_status = getattr(d, 'payment_status', None) or 'paid'
            doc_type = getattr(d, 'doc_type', None) or 'receipt'
            client = getattr(d, 'client_name', None) or ''
            lines.append(
                f"- {d.filename} | vendor:{d.vendor or 'Unknown'} | client:{client or 'N/A'} | "
                f"${d.total_amount or 0:,.2f} | {doc_type} | {payment_status}"
            )

        lines.append("=== END DOCUMENTS CONTEXT ===")
        return "\n".join(lines)

    except Exception as e:
        return f"Documents context error: {e}"


async def build_invoices_context(
    db: AsyncSession,
    user_id: str
) -> str:
    try:
        from datetime import timedelta
        result = await db.execute(
            select(Invoice).where(Invoice.user_id == user_id)
        )
        invoices = result.scalars().all()

        now = datetime.utcnow()
        today = now.date()
        today_str = now.strftime("%Y-%m-%d")
        this_month = now.strftime("%Y-%m")
        last_month_dt = now.replace(day=1) - timedelta(days=1)
        last_month = last_month_dt.strftime("%Y-%m")

        def parse_date(d):
            if d is None:
                return None
            if hasattr(d, 'year') and not hasattr(d, 'time'):
                return d
            if hasattr(d, 'date'):
                return d.date()
            try:
                return datetime.strptime(str(d)[:10], "%Y-%m-%d").date()
            except Exception:
                return None

        marked_paid = [i for i in invoices if (i.status or "").lower() == "paid"]
        marked_draft = [i for i in invoices if (i.status or "").lower() == "draft"]

        truly_overdue = []
        upcoming = []
        for i in invoices:
            s = (i.status or "").lower()
            if s in ("paid", "draft"):
                continue
            dd = parse_date(i.due_date)
            if dd is None:
                continue
            if dd < today:
                truly_overdue.append(i)
            else:
                upcoming.append(i)

        outstanding_overdue = sum(float(i.total or 0) for i in truly_overdue)
        outstanding_upcoming = sum(float(i.total or 0) for i in upcoming)

        def created_in(i, m):
            ca = i.created_at
            if ca is None:
                return False
            return str(ca).startswith(m)

        this_month_inv = [i for i in invoices if created_in(i, this_month)]
        last_month_inv = [i for i in invoices if created_in(i, last_month)]

        total_billed = sum(float(i.total or 0) for i in invoices if (i.status or "").lower() != "draft")
        total_paid = sum(float(i.total or 0) for i in marked_paid)

        lines = [
            "=== INVOICES CONTEXT ===",
            f"TODAY: {today_str}",
            f"CURRENT_MONTH: {this_month}",
            "",
            "## SUMMARY",
            f"Total invoices: {len(invoices)}",
            f"Paid: {len(marked_paid)} (${total_paid:,.2f})",
            f"Draft: {len(marked_draft)}",
            f"Truly overdue (past due_date, unpaid): {len(truly_overdue)} (${outstanding_overdue:,.2f})",
            f"Upcoming (future due_date, unpaid): {len(upcoming)} (${outstanding_upcoming:,.2f})",
            f"Total billed (non-draft): ${total_billed:,.2f}",
            "",
            f"## THIS MONTH ({this_month})",
            f"Invoices created this month: {len(this_month_inv)} (${sum(float(i.total or 0) for i in this_month_inv):,.2f})",
            "",
            f"## LAST MONTH ({last_month})",
            f"Invoices created last month: {len(last_month_inv)} (${sum(float(i.total or 0) for i in last_month_inv):,.2f})",
            "",
        ]

        if truly_overdue:
            lines += ["## OVERDUE INVOICES (action needed)"]
            for i in sorted(truly_overdue, key=lambda x: parse_date(x.due_date) or today):
                lines.append(
                    f"- #{i.invoice_number or 'N/A'} | to:{i.to_name or 'Unknown'} | "
                    f"${i.total or 0:,.2f} | due:{i.due_date or '?'} | status:{i.status or 'unknown'}"
                )
            lines.append("")

        lines += ["## ALL INVOICES (most recent first, top 30)"]
        for i in sorted(invoices, key=lambda x: x.created_at or datetime.utcnow(), reverse=True)[:30]:
            lines.append(
                f"- #{i.invoice_number or 'N/A'} | to:{i.to_name or 'Unknown'} | "
                f"${i.total or 0:,.2f} | {i.status or 'unknown'} | due:{i.due_date or '?'}"
            )

        lines.append("=== END INVOICES CONTEXT ===")
        return "\n".join(lines)

    except Exception as e:
        return f"Invoices context error: {e}"


async def build_tax_context(db: AsyncSession, user_id: str) -> str:
    try:
        txn_result = await db.execute(
            select(Transaction).where(Transaction.user_id == user_id)
        )
        transactions = txn_result.scalars().all()

        inv_result = await db.execute(
            select(Invoice).where(Invoice.user_id == user_id)
        )
        invoices = inv_result.scalars().all()

        now = datetime.utcnow()
        today_str = now.strftime("%Y-%m-%d")
        this_year = now.strftime("%Y")
        last_year = str(int(this_year) - 1)

        month_num = now.month
        quarter = (month_num - 1) // 3 + 1
        quarter_label = f"Q{quarter} {this_year}"

        def in_year(t, y):
            return str(t.txn_date or "").startswith(y)

        def in_quarter(t, year, q):
            d = str(t.txn_date or "")[:7]
            if not d.startswith(year):
                return False
            try:
                m = int(d[5:7])
                tq = (m - 1) // 3 + 1
                return tq == q
            except Exception:
                return False

        expenses = [t for t in transactions if (t.txn_type or "").lower() == "expense"]
        income_txns = [t for t in transactions if (t.txn_type or "").lower() == "income"]

        ytd_exp = sum(abs(t.amount or 0) for t in expenses if in_year(t, this_year))
        ytd_inc = sum(abs(t.amount or 0) for t in income_txns if in_year(t, this_year))
        ytd_paid_inv = sum(float(i.total or 0) for i in invoices if (i.status or "").lower() == "paid" and str(i.created_at or "").startswith(this_year))
        ytd_total_income = ytd_inc + ytd_paid_inv

        ly_exp = sum(abs(t.amount or 0) for t in expenses if in_year(t, last_year))
        ly_inc = sum(abs(t.amount or 0) for t in income_txns if in_year(t, last_year))

        q_exp = sum(abs(t.amount or 0) for t in expenses if in_quarter(t, this_year, quarter))
        q_inc = sum(abs(t.amount or 0) for t in income_txns if in_quarter(t, this_year, quarter))

        ytd_profit = ytd_total_income - ytd_exp
        estimated_tax_15 = max(ytd_profit * 0.15, 0.0)
        estimated_tax_20 = max(ytd_profit * 0.20, 0.0)
        estimated_tax_25 = max(ytd_profit * 0.25, 0.0)

        deductible_cats = {}
        for t in expenses:
            if not in_year(t, this_year):
                continue
            cat = t.category or t.ml_category or "Uncategorized"
            deductible_cats[cat] = deductible_cats.get(cat, 0) + abs(t.amount or 0)
        top_deductible = sorted(deductible_cats.items(), key=lambda x: x[1], reverse=True)[:8]

        lines = [
            "=== TAX CONTEXT ===",
            f"TODAY: {today_str}",
            f"CURRENT_YEAR: {this_year}",
            f"CURRENT_QUARTER: {quarter_label}",
            "",
            f"## YEAR-TO-DATE ({this_year})",
            f"YTD_INCOME: ${ytd_total_income:,.2f}",
            f"  - From transactions: ${ytd_inc:,.2f}",
            f"  - From paid invoices: ${ytd_paid_inv:,.2f}",
            f"YTD_EXPENSES (deductible): ${ytd_exp:,.2f}",
            f"YTD_NET_PROFIT: ${ytd_profit:,.2f}",
            "",
            "## ESTIMATED TAX OWED (rough)",
            f"At 15% rate: ${estimated_tax_15:,.2f}",
            f"At 20% rate: ${estimated_tax_20:,.2f}",
            f"At 25% rate: ${estimated_tax_25:,.2f}",
            "(Actual rate depends on jurisdiction, brackets, and deductions. These are rough estimates only.)",
            "",
            f"## CURRENT QUARTER ({quarter_label})",
            f"Q_INCOME: ${q_inc:,.2f}",
            f"Q_EXPENSES: ${q_exp:,.2f}",
            f"Q_NET: ${q_inc - q_exp:,.2f}",
            "",
            f"## LAST YEAR ({last_year}, FOR COMPARISON)",
            f"LY_INCOME: ${ly_inc:,.2f}",
            f"LY_EXPENSES: ${ly_exp:,.2f}",
            f"LY_NET: ${ly_inc - ly_exp:,.2f}",
            "",
            "## TOP DEDUCTIBLE CATEGORIES (YTD)",
        ]
        for cat, amt in top_deductible:
            lines.append(f"- {cat}: ${amt:,.2f}")

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
You are Novala's Executive Finance Copilot.

You are an intelligent assistant that helps users with:
1. Financial insights based on real data
2. Business advice and decision-making
3. Explaining Novala features and value

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
You are Novala's Transaction Analyst.

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
You are Novala's Document Extraction and Payment Assistant.

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
You are Novala's Billing and Receivables Assistant.

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
You are Novala's Tax Preparation Assistant.

YOU KNOW HOW THE TAX CALCULATOR WORKS:
- Users can estimate tax from revenue and deductible expenses
- Taxable income is generally income minus expenses
- Tax can be estimated using a selected rate

{base_rules}

REAL DATA:
{real_data}
""",
        "team": f"""
You are Novala's Team Access and Permissions Assistant.

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
You are Novala's Vendor Analytics Assistant.

YOU KNOW HOW VENDOR ANALYTICS WORK:
- Transactions are grouped by vendor
- Users can review top vendors by spend
- Vendor patterns help users understand repeat spending

{base_rules}

REAL DATA:
{real_data}
""",
        "budgets": f"""
You are Novala's Budget Management Assistant.

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
You are Novala's Receipt Scanner Assistant.

YOU KNOW HOW RECEIPT SCANNING WORKS:
- Users upload receipt images
- OCR extracts vendor, date, amount, tax, and category suggestions
- Users can review and save the result into their books

{base_rules}

REAL DATA:
{real_data}
""",
        "integrations": f"""
You are Novala's Integrations Assistant.

YOU KNOW HOW INTEGRATIONS WORK:
- QuickBooks and Xero can sync accounting records
- Stripe can sync payment activity
- Connected means active; offline means not connected

{base_rules}

REAL DATA:
{real_data}
""",
        "currency": f"""
You are Novala's Currency Assistant.

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