"""Reconciliation alerting - notifies humans when critical mismatches happen.

Rate-limited to prevent spam (max 1 alert per issue_key per hour).
Uses SendGrid for emails, structured logging for observability.

Scale considerations:
- Rate limits stored in DB (later: Redis for billion-user scale)
- Alerts fire async, never block payroll
- Configurable per environment (dev = log only, prod = email + log)
"""
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select, and_

from app.db.database import AsyncSessionLocal
from app.models.models import ReconciliationRun, ReconciliationMismatch


logger = logging.getLogger("novala.reconciliation.alerting")


ALERT_RATE_LIMIT_HOURS = 1


async def alert_critical_mismatch(run_id: uuid.UUID) -> None:
    """Send alert for a critical reconciliation mismatch.

    Args:
        run_id: The ReconciliationRun that had critical mismatches

    Rate-limited: won't alert twice for same field within ALERT_RATE_LIMIT_HOURS.
    Failures don't crash payroll (all exceptions caught).
    """
    try:
        async with AsyncSessionLocal() as db:
            # Load the run
            run = await db.get(ReconciliationRun, run_id)
            if run is None:
                return

            # Load mismatches
            stmt = select(ReconciliationMismatch).where(
                ReconciliationMismatch.run_id == run_id,
                ReconciliationMismatch.severity == "critical",
            )
            result = await db.execute(stmt)
            critical_mismatches = result.scalars().all()

            if not critical_mismatches:
                return

            # Rate limit check: has any critical alert fired for this field recently?
            cutoff = datetime.now(timezone.utc) - timedelta(hours=ALERT_RATE_LIMIT_HOURS)
            for mismatch in critical_mismatches:
                recent_stmt = select(ReconciliationMismatch).join(
                    ReconciliationRun,
                    ReconciliationRun.id == ReconciliationMismatch.run_id
                ).where(and_(
                    ReconciliationMismatch.field_name == mismatch.field_name,
                    ReconciliationMismatch.severity == "critical",
                    ReconciliationRun.checked_at >= cutoff,
                    ReconciliationRun.id != run_id,
                ))
                recent_result = await db.execute(recent_stmt)
                if recent_result.scalars().first() is not None:
                    logger.info(f"Rate limited: {mismatch.field_name} already alerted in last hour")
                    return

            # Log structured alert (always, regardless of email)
            logger.critical(
                "reconciliation_critical_mismatch",
                extra={
                    "run_id": str(run_id),
                    "customer_id": str(run.customer_id) if run.customer_id else None,
                    "country": run.country,
                    "subnational": run.subnational,
                    "gross_pay": str(run.gross_pay),
                    "mismatch_count": run.mismatch_count,
                    "total_diff_cents": run.total_diff_cents,
                    "fields": [m.field_name for m in critical_mismatches],
                },
            )

            # Send email if enabled
            if os.getenv("RECONCILIATION_ALERTS_EMAIL_ENABLED", "false").lower() == "true":
                await _send_email_alert(run, critical_mismatches)

    except Exception as e:
        # Alerting must never break payroll
        logger.exception(f"Alert dispatch failed: {e}")


async def _send_email_alert(
    run: ReconciliationRun,
    mismatches: list[ReconciliationMismatch],
) -> None:
    """Send email alert via SendGrid."""
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail
        from app.core.config import settings

        subject = f"[NOVALA CRITICAL] Reconciliation mismatch: {run.mismatch_count} issue(s) in {run.country}-{run.subnational or 'N/A'}"

        body_lines = [
            f"Critical reconciliation mismatch detected.",
            "",
            f"Run ID: {run.id}",
            f"Customer ID: {run.customer_id or 'N/A'}",
            f"Country: {run.country}",
            f"Subnational: {run.subnational or 'N/A'}",
            f"Tax Year: {run.tax_year}",
            f"Gross Pay: ${run.gross_pay}",
            f"Engine: {run.engine_version}",
            f"Total Diff: {run.total_diff_cents} cents",
            "",
            "MISMATCHES:",
        ]
        for m in mismatches:
            body_lines.append(
                f"  - {m.field_name}: expected {m.expected_value}, got {m.actual_value} "
                f"(diff: {m.diff_cents} cents, severity: {m.severity})"
            )

        body_lines.extend([
            "",
            "Investigate immediately at /api/v1/admin/reconciliation/runs/" + str(run.id),
        ])

        message = Mail(
            from_email="alerts@getnovala.com",
            to_emails=settings.feedback_to_email,
            subject=subject,
            plain_text_content="\n".join(body_lines),
        )
        sg = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)
        sg.send(message)
        logger.info(f"Alert email sent for run {run.id}")

    except Exception as e:
        logger.exception(f"SendGrid email failed: {e}")
