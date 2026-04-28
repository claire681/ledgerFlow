"""
LedgerFlow Timeline Service
Generates and manages monthly financial snapshots.
Used for trend analysis, AI insights, and dashboard charts.
Auto-updated whenever transactions or invoices change.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.models import (
    FinancialTimeline, Transaction, Invoice, Document, Budget,
)
from datetime import datetime
from typing import Optional
import calendar


# ── Generate or update monthly snapshot ──────────────────────────────────

async def generate_monthly_snapshot(
    db:      AsyncSession,
    user_id: str,
    year:    Optional[int] = None,
    month:   Optional[int] = None,
) -> FinancialTimeline:
    """
    Generates a financial snapshot for a given month.
    If year/month not provided uses current month.
    If snapshot already exists for that month it updates it.
    """
    now   = datetime.utcnow()
    year  = year  or now.year
    month = month or now.month
    period = f"{year}-{month:02d}"

    # ── Pull all transactions for this month ──────────────────────────────
    txn_result = await db.execute(
        select(Transaction).where(
            Transaction.user_id == user_id,
        )
    )
    all_transactions = txn_result.scalars().all()

    # Filter to this month
    month_transactions = [
        t for t in all_transactions
        if t.txn_date and t.txn_date.startswith(f"{year}-{month:02d}")
    ]

    # Calculate revenue and expenses
    income_txns  = [t for t in month_transactions if t.txn_type == "income"]
    expense_txns = [t for t in month_transactions if t.txn_type == "expense"]
    total_revenue  = sum(abs(t.amount) for t in income_txns)
    total_expenses = sum(abs(t.amount) for t in expense_txns)
    gross_profit   = total_revenue - total_expenses

    # Top spending categories
    category_totals: dict[str, float] = {}
    for t in expense_txns:
        cat = t.category or t.ml_category or "Uncategorized"
        category_totals[cat] = category_totals.get(cat, 0) + abs(t.amount)

    top_categories = dict(
        sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    )

    # ── Pull invoices for this month ──────────────────────────────────────
    inv_result = await db.execute(
        select(Invoice).where(Invoice.user_id == user_id)
    )
    all_invoices = inv_result.scalars().all()

    month_invoices = [
        i for i in all_invoices
        if i.created_at and
        i.created_at.year == year and
        i.created_at.month == month
    ]

    invoice_revenue = sum(
        i.total for i in month_invoices if i.status == "paid"
    )
    paid_invoices  = len([i for i in month_invoices if i.status == "paid"])

    # ── Pull documents for this month ─────────────────────────────────────
    doc_result = await db.execute(
        select(Document).where(Document.user_id == user_id)
    )
    all_docs = doc_result.scalars().all()

    month_docs = [
        d for d in all_docs
        if d.uploaded_at and
        d.uploaded_at.year == year and
        d.uploaded_at.month == month
    ]

    # ── Simple tax estimate (21% flat for now) ────────────────────────────
    tax_estimate = max(gross_profit, 0) * 0.21
    net_after_tax = gross_profit - tax_estimate

    # ── Get previous month for change calculation ─────────────────────────
    prev_month = month - 1 if month > 1 else 12
    prev_year  = year if month > 1 else year - 1
    prev_period = f"{prev_year}-{prev_month:02d}"

    prev_result = await db.execute(
        select(FinancialTimeline).where(
            FinancialTimeline.user_id == user_id,
            FinancialTimeline.period  == prev_period,
        )
    )
    prev_snapshot = prev_result.scalar_one_or_none()

    revenue_change = 0.0
    expense_change = 0.0
    profit_change  = 0.0

    if prev_snapshot and prev_snapshot.total_revenue > 0:
        revenue_change = ((total_revenue - prev_snapshot.total_revenue) /
                         prev_snapshot.total_revenue) * 100
    if prev_snapshot and prev_snapshot.total_expenses > 0:
        expense_change = ((total_expenses - prev_snapshot.total_expenses) /
                         prev_snapshot.total_expenses) * 100
    if prev_snapshot and prev_snapshot.gross_profit != 0:
        profit_change = ((gross_profit - prev_snapshot.gross_profit) /
                        abs(prev_snapshot.gross_profit)) * 100

    # ── Check if snapshot already exists ─────────────────────────────────
    existing_result = await db.execute(
        select(FinancialTimeline).where(
            FinancialTimeline.user_id == user_id,
            FinancialTimeline.period  == period,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        # Update existing snapshot
        existing.total_revenue     = total_revenue
        existing.invoice_revenue   = invoice_revenue
        existing.other_revenue     = total_revenue - invoice_revenue
        existing.total_expenses    = total_expenses
        existing.top_categories    = top_categories
        existing.gross_profit      = gross_profit
        existing.net_profit        = gross_profit
        existing.tax_estimate      = tax_estimate
        existing.net_after_tax     = net_after_tax
        existing.invoice_count     = len(month_invoices)
        existing.paid_invoices     = paid_invoices
        existing.transaction_count = len(month_transactions)
        existing.document_count    = len(month_docs)
        existing.revenue_change    = round(revenue_change, 1)
        existing.expense_change    = round(expense_change, 1)
        existing.profit_change     = round(profit_change, 1)
        existing.updated_at        = datetime.utcnow()
        await db.commit()
        return existing
    else:
        # Create new snapshot
        snapshot = FinancialTimeline(
            user_id          = user_id,
            period           = period,
            year             = year,
            month            = month,
            total_revenue    = total_revenue,
            invoice_revenue  = invoice_revenue,
            other_revenue    = total_revenue - invoice_revenue,
            total_expenses   = total_expenses,
            top_categories   = top_categories,
            gross_profit     = gross_profit,
            net_profit       = gross_profit,
            tax_estimate     = tax_estimate,
            net_after_tax    = net_after_tax,
            invoice_count    = len(month_invoices),
            paid_invoices    = paid_invoices,
            transaction_count= len(month_transactions),
            document_count   = len(month_docs),
            revenue_change   = round(revenue_change, 1),
            expense_change   = round(expense_change, 1),
            profit_change    = round(profit_change, 1),
        )
        db.add(snapshot)
        await db.commit()
        await db.refresh(snapshot)
        return snapshot


# ── Get timeline history ──────────────────────────────────────────────────

async def get_timeline(
    db:      AsyncSession,
    user_id: str,
    months:  int = 12,
) -> list[FinancialTimeline]:
    """
    Get the last N months of financial snapshots.
    Used for dashboard charts and AI trend analysis.
    """
    result = await db.execute(
        select(FinancialTimeline)
        .where(FinancialTimeline.user_id == user_id)
        .order_by(desc(FinancialTimeline.period))
        .limit(months)
    )
    snapshots = result.scalars().all()
    return list(reversed(snapshots))


# ── Get latest snapshot ───────────────────────────────────────────────────

async def get_latest_snapshot(
    db:      AsyncSession,
    user_id: str,
) -> Optional[FinancialTimeline]:
    """Get the most recent financial snapshot."""
    result = await db.execute(
        select(FinancialTimeline)
        .where(FinancialTimeline.user_id == user_id)
        .order_by(desc(FinancialTimeline.period))
        .limit(1)
    )
    return result.scalar_one_or_none()


# ── Build timeline summary for AI ────────────────────────────────────────

async def build_timeline_summary(
    db:      AsyncSession,
    user_id: str,
) -> str:
    """
    Builds a text summary of financial trends
    that gets included in the AI context prompt.
    """
    snapshots = await get_timeline(db, user_id, months=6)

    if not snapshots:
        return "No financial history available yet."

    lines = ["Financial history (last 6 months):"]
    for s in snapshots:
        revenue_arrow = "↑" if s.revenue_change > 0 else "↓" if s.revenue_change < 0 else "→"
        lines.append(
            f"- {s.period}: "
            f"Revenue {s.total_revenue:,.0f} {revenue_arrow} {abs(s.revenue_change):.1f}% | "
            f"Expenses {s.total_expenses:,.0f} | "
            f"Profit {s.gross_profit:,.0f} | "
            f"Tax est. {s.tax_estimate:,.0f}"
        )

    latest = snapshots[-1] if snapshots else None
    if latest:
        lines.append(f"\nCurrent month ({latest.period}):")
        lines.append(f"- Revenue: {latest.total_revenue:,.2f}")
        lines.append(f"- Expenses: {latest.total_expenses:,.2f}")
        lines.append(f"- Net Profit: {latest.gross_profit:,.2f}")
        lines.append(f"- Estimated Tax: {latest.tax_estimate:,.2f}")
        lines.append(f"- Net After Tax: {latest.net_after_tax:,.2f}")

        if latest.top_categories:
            lines.append(f"- Top spending categories: " +
                ", ".join(f"{k} ({v:,.0f})" for k, v in
                list(latest.top_categories.items())[:3]))

    return "\n".join(lines)