"""
LedgerFlow Activity Service
Logs every significant action the user takes.
Used by the AI to understand what the user has been doing.
Also powers the dashboard recent activity feed.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.models import ActivityLog
from typing import Optional
from datetime import datetime


# ── Action descriptions ───────────────────────────────────────────────────
# Human-readable descriptions for each action type

ACTION_DESCRIPTIONS = {
    "invoice_created":     "Created a new invoice",
    "invoice_updated":     "Updated an invoice",
    "invoice_deleted":     "Deleted an invoice",
    "invoice_paid":        "Marked an invoice as paid",
    "transaction_added":   "Added a new transaction",
    "transaction_updated": "Updated a transaction",
    "document_uploaded":   "Uploaded a document",
    "document_deleted":    "Deleted a document",
    "receipt_scanned":     "Scanned a receipt",
    "budget_created":      "Created a new budget",
    "budget_updated":      "Updated a budget",
    "tax_calculated":      "Ran a tax calculation",
    "tax_report_saved":    "Saved a tax report",
    "scenario_saved":      "Saved a what-if scenario",
    "ai_question_asked":   "Asked the AI a question",
    "report_exported":     "Exported a report as PDF",
    "profile_updated":     "Updated company profile",
    "team_member_invited": "Invited a team member",
    "login":               "Logged in",
}


# ── Log an activity ───────────────────────────────────────────────────────

async def log_activity(
    db:          AsyncSession,
    user_id:     str,
    action_type: str,
    page:        Optional[str] = None,
    action_data: Optional[dict] = None,
    description: Optional[str] = None,
):
    """
    Log a user action to the activity log.
    Called from any route after a significant action.

    Example usage in a route:
        await log_activity(
            db, user_id,
            action_type="invoice_created",
            page="invoices",
            action_data={"invoice_number": "INV-001", "total": 1500.00},
        )
    """
    activity = ActivityLog(
        user_id     = user_id,
        action_type = action_type,
        page        = page,
        action_data = action_data or {},
        description = description or ACTION_DESCRIPTIONS.get(action_type, action_type),
        created_at  = datetime.utcnow(),
    )
    db.add(activity)
    await db.commit()


# ── Get recent activity ───────────────────────────────────────────────────

async def get_recent_activity(
    db:      AsyncSession,
    user_id: str,
    limit:   int = 20,
) -> list[ActivityLog]:
    """
    Get the most recent activity for a user.
    Used by the dashboard recent activity feed
    and by the AI to understand what the user has been doing.
    """
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.user_id == user_id)
        .order_by(desc(ActivityLog.created_at))
        .limit(limit)
    )
    return result.scalars().all()


# ── Build activity summary for AI ────────────────────────────────────────

async def build_activity_summary(
    db:      AsyncSession,
    user_id: str,
    limit:   int = 10,
) -> str:
    """
    Builds a human-readable summary of recent activity
    that gets included in the AI context prompt.
    """
    activities = await get_recent_activity(db, user_id, limit)

    if not activities:
        return "No recent activity recorded."

    lines = ["Recent user activity (most recent first):"]
    for activity in activities:
        timestamp = activity.created_at.strftime("%b %d, %Y %H:%M") \
            if activity.created_at else "Unknown time"
        lines.append(f"- [{timestamp}] {activity.description}")

    return "\n".join(lines)


# ── Get activity counts ───────────────────────────────────────────────────

async def get_activity_counts(
    db:      AsyncSession,
    user_id: str,
) -> dict:
    """
    Returns counts of different action types.
    Useful for dashboard stats and AI context.
    """
    activities = await get_recent_activity(db, user_id, limit=500)

    counts: dict[str, int] = {}
    for activity in activities:
        counts[activity.action_type] = counts.get(activity.action_type, 0) + 1

    return {
        "total_actions":       len(activities),
        "invoices_created":    counts.get("invoice_created", 0),
        "documents_uploaded":  counts.get("document_uploaded", 0),
        "receipts_scanned":    counts.get("receipt_scanned", 0),
        "tax_calculations":    counts.get("tax_calculated", 0),
        "ai_questions_asked":  counts.get("ai_question_asked", 0),
        "reports_exported":    counts.get("report_exported", 0),
        "by_type":             counts,
    }