"""Draft pay run auto-cleanup.

Deletes draft pay runs older than 7 days. Called by scheduled task.
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import PayRun, PayStub
from app.db.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

# Alberta ESA + North American norm: drafts older than 7 days auto-delete
DRAFT_TTL_DAYS = 7


async def cleanup_old_draft_pay_runs(db: AsyncSession) -> int:
    """Delete draft pay runs older than DRAFT_TTL_DAYS.

    Returns the number of pay runs deleted.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=DRAFT_TTL_DAYS)

    stmt = select(PayRun).where(
        PayRun.status == "draft",
        PayRun.created_at < cutoff,
    )
    result = await db.execute(stmt)
    old_drafts = result.scalars().all()

    if not old_drafts:
        return 0

    count = 0
    for run in old_drafts:
        # Cascade delete related pay stubs
        await db.execute(
            delete(PayStub).where(PayStub.pay_run_id == run.id)
        )
        await db.delete(run)
        count += 1

    await db.commit()
    logger.info(f"Auto-deleted {count} draft pay runs older than {DRAFT_TTL_DAYS} days")
    return count


async def run_cleanup():
    """Entry point for scheduled cleanup."""
    async with AsyncSessionLocal() as session:
        try:
            count = await cleanup_old_draft_pay_runs(session)
            if count > 0:
                print(f"[DraftCleanup] Deleted {count} draft pay runs")
        except Exception as e:
            logger.error(f"Draft cleanup failed: {e}")
            print(f"[DraftCleanup] Error: {e}")


if __name__ == "__main__":
    asyncio.run(run_cleanup())