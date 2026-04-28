"""
LedgerFlow Memory Service
Builds and manages AI memory about users and their businesses.
Memory is included in every AI call so the assistant always knows the user deeply.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models.models import (
    AIMemory, AIConversation, User, CompanyProfile,
    Transaction, Invoice, Budget, ActivityLog,
)
from datetime import datetime
from typing import Optional
import json


# ── Save or update a memory fact ──────────────────────────────────────────

async def save_memory(
    db:           AsyncSession,
    user_id:      str,
    memory_key:   str,
    memory_value: str,
    memory_type:  str = "business_fact",
    source:       str = "ai_observed",
    confidence:   float = 1.0,
):
    """
    Save a memory fact about the user.
    If the key already exists it updates the value.
    """
    # Check if memory already exists
    result = await db.execute(
        select(AIMemory).where(
            AIMemory.user_id    == user_id,
            AIMemory.memory_key == memory_key,
            AIMemory.is_active  == True,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing memory
        existing.memory_value = memory_value
        existing.confidence   = confidence
        existing.source       = source
        existing.updated_at   = datetime.utcnow()
        await db.commit()
    else:
        # Create new memory
        memory = AIMemory(
            user_id      = user_id,
            memory_key   = memory_key,
            memory_value = memory_value,
            memory_type  = memory_type,
            source       = source,
            confidence   = confidence,
            is_active    = True,
        )
        db.add(memory)
        await db.commit()


# ── Get all memories for a user ───────────────────────────────────────────

async def get_memories(
    db:      AsyncSession,
    user_id: str,
) -> list[AIMemory]:
    """Get all active memory facts for a user."""
    result = await db.execute(
        select(AIMemory).where(
            AIMemory.user_id   == user_id,
            AIMemory.is_active == True,
        ).order_by(AIMemory.memory_type)
    )
    return result.scalars().all()


# ── Clear all memories for a user ────────────────────────────────────────

async def clear_memories(
    db:      AsyncSession,
    user_id: str,
):
    """Clear all AI memory for a user. Used when user requests memory reset."""
    await db.execute(
        update(AIMemory)
        .where(AIMemory.user_id == user_id)
        .values(is_active=False)
    )
    await db.commit()


# ── Build memory prompt for AI calls ─────────────────────────────────────

async def build_memory_prompt(
    db:      AsyncSession,
    user_id: str,
) -> str:
    """
    Assembles a structured memory block that gets prepended to every AI call.
    This makes the AI deeply aware of the user and their business.
    """
    memories = await get_memories(db, user_id)

    if not memories:
        return ""

    # Group memories by type
    groups: dict[str, list] = {}
    for m in memories:
        if m.memory_type not in groups:
            groups[m.memory_type] = []
        groups[m.memory_type].append(f"- {m.memory_key}: {m.memory_value}")

    # Build the prompt block
    lines = ["=== LEDGERFLOW USER MEMORY ==="]

    type_labels = {
        "business_fact": "Business Profile",
        "preference":    "User Preferences",
        "goal":          "Business Goals",
        "observation":   "AI Observations",
        "pattern":       "Detected Patterns",
    }

    for memory_type, items in groups.items():
        label = type_labels.get(memory_type, memory_type.title())
        lines.append(f"\n{label}:")
        lines.extend(items)

    lines.append("\n=== END OF USER MEMORY ===\n")

    return "\n".join(lines)


# ── Auto-build memory from user data ─────────────────────────────────────

async def observe_and_update_memory(
    db:      AsyncSession,
    user_id: str,
):
    """
    Automatically observes patterns from user data and saves them as memory.
    Called periodically and after significant events.
    """

    # ── Company profile facts ─────────────────────────────────────────────
    profile_result = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()

    if profile:
        if profile.company_name:
            await save_memory(db, user_id, "company_name",
                profile.company_name, "business_fact", "user_stated")
        if profile.business_type:
            await save_memory(db, user_id, "business_type",
                profile.business_type, "business_fact", "user_stated")
        if profile.country:
            await save_memory(db, user_id, "country",
                profile.country, "business_fact", "user_stated")
        if profile.province_state:
            await save_memory(db, user_id, "province_state",
                profile.province_state, "business_fact", "user_stated")
        if profile.currency:
            await save_memory(db, user_id, "preferred_currency",
                profile.currency, "preference", "user_stated")
        if profile.annual_revenue_est:
            await save_memory(db, user_id, "estimated_annual_revenue",
                f"{profile.currency} {profile.annual_revenue_est:,.0f}",
                "business_fact", "user_stated")
        if profile.industry:
            await save_memory(db, user_id, "industry",
                profile.industry, "business_fact", "user_stated")
        if profile.employee_count:
            await save_memory(db, user_id, "employee_count",
                str(profile.employee_count), "business_fact", "user_stated")

    # ── Transaction patterns ──────────────────────────────────────────────
    txn_result = await db.execute(
        select(Transaction).where(Transaction.user_id == user_id)
    )
    transactions = txn_result.scalars().all()

    if transactions:
        total_count    = len(transactions)
        expenses       = [t for t in transactions if t.txn_type == "expense"]
        income         = [t for t in transactions if t.txn_type == "income"]
        total_expense  = sum(abs(t.amount) for t in expenses)
        total_income   = sum(abs(t.amount) for t in income)
        uncategorized  = [t for t in transactions if not t.category]

        await save_memory(db, user_id, "total_transactions",
            str(total_count), "observation", "calculated")
        await save_memory(db, user_id, "total_expenses_recorded",
            f"{total_expense:,.2f}", "observation", "calculated")
        await save_memory(db, user_id, "total_income_recorded",
            f"{total_income:,.2f}", "observation", "calculated")

        if uncategorized:
            await save_memory(db, user_id, "uncategorized_transactions",
                str(len(uncategorized)), "observation", "calculated")

        # Top spending categories
        category_totals: dict[str, float] = {}
        for t in expenses:
            cat = t.category or t.ml_category or "Uncategorized"
            category_totals[cat] = category_totals.get(cat, 0) + abs(t.amount)

        if category_totals:
            top_cat = max(category_totals, key=lambda k: category_totals[k])
            await save_memory(db, user_id, "top_spending_category",
                f"{top_cat} ({category_totals[top_cat]:,.2f})",
                "pattern", "calculated")

    # ── Invoice patterns ──────────────────────────────────────────────────
    inv_result = await db.execute(
        select(Invoice).where(Invoice.user_id == user_id)
    )
    invoices = inv_result.scalars().all()

    if invoices:
        paid     = [i for i in invoices if i.status == "paid"]
        overdue  = [i for i in invoices if i.status == "overdue"]
        due      = [i for i in invoices if i.status == "due"]
        total_invoiced = sum(i.total for i in invoices)
        total_paid     = sum(i.total for i in paid)
        outstanding    = sum(i.total for i in due + overdue)

        await save_memory(db, user_id, "total_invoices_created",
            str(len(invoices)), "observation", "calculated")
        await save_memory(db, user_id, "total_invoiced_amount",
            f"{total_invoiced:,.2f}", "observation", "calculated")
        await save_memory(db, user_id, "total_paid_revenue",
            f"{total_paid:,.2f}", "observation", "calculated")

        if outstanding > 0:
            await save_memory(db, user_id, "outstanding_invoice_amount",
                f"{outstanding:,.2f} across {len(due + overdue)} invoices",
                "observation", "calculated")

        if overdue:
            await save_memory(db, user_id, "overdue_invoices",
                f"{len(overdue)} overdue invoices",
                "observation", "calculated")

        # Detect frequent clients
        client_counts: dict[str, int] = {}
        for inv in invoices:
            if inv.to_name:
                client_counts[inv.to_name] = client_counts.get(inv.to_name, 0) + 1

        if client_counts:
            top_client = max(client_counts, key=lambda k: client_counts[k])
            await save_memory(db, user_id, "most_frequent_client",
                top_client, "pattern", "calculated")

    # ── Budget patterns ───────────────────────────────────────────────────
    budget_result = await db.execute(
        select(Budget).where(Budget.user_id == user_id)
    )
    budgets = budget_result.scalars().all()

    if budgets:
        exceeded = [b for b in budgets if b.status == "exceeded"]
        if exceeded:
            cats = ", ".join(b.category for b in exceeded)
            await save_memory(db, user_id, "over_budget_categories",
                cats, "observation", "calculated")

        await save_memory(db, user_id, "active_budgets",
            str(len(budgets)), "observation", "calculated")


# ── Extract and save memories from AI conversation ────────────────────────

async def extract_memories_from_conversation(
    db:       AsyncSession,
    user_id:  str,
    user_msg: str,
    ai_reply: str,
):
    """
    Scans a conversation exchange for facts the user stated about themselves
    and saves them as memory. Called after every AI conversation.
    """
    msg_lower = user_msg.lower()

    # Revenue mentions
    import re
    revenue_patterns = [
        r"(?:make|earn|revenue of|revenue is|bringing in)\s*\$?([\d,]+)",
        r"\$([\d,]+)\s*(?:per year|annually|a year)",
    ]
    for pattern in revenue_patterns:
        match = re.search(pattern, msg_lower)
        if match:
            amount = match.group(1).replace(",", "")
            await save_memory(
                db, user_id,
                "stated_annual_revenue",
                f"{amount}",
                "business_fact",
                "user_stated",
                confidence=0.9,
            )
            break

    # Goal mentions
    goal_keywords = ["goal", "target", "aim", "trying to", "want to reach"]
    if any(kw in msg_lower for kw in goal_keywords):
        await save_memory(
            db, user_id,
            "recent_goal_mention",
            user_msg[:200],
            "goal",
            "user_stated",
            confidence=0.8,
        )

    # Location mentions
    location_keywords = ["i am in", "i'm in", "based in", "located in", "i live in"]
    if any(kw in msg_lower for kw in location_keywords):
        await save_memory(
            db, user_id,
            "stated_location",
            user_msg[:100],
            "business_fact",
            "user_stated",
            confidence=0.85,
        )