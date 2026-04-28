"""
LedgerFlow Financial Snapshots Routes
Monthly financial snapshots for trend analysis and AI insights.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.services.timeline_service import (
    generate_monthly_snapshot,
    get_timeline,
    get_latest_snapshot,
)
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/snapshots", tags=["Snapshots"])


# ── GET latest snapshot ───────────────────────────────────────────────────

@router.get("/latest")
async def get_latest(
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Get the most recent financial snapshot."""
    snapshot = await get_latest_snapshot(db, current_user.id)

    if not snapshot:
        # Generate one now if none exists
        snapshot = await generate_monthly_snapshot(db, current_user.id)

    return snapshot


# ── GET timeline ──────────────────────────────────────────────────────────

@router.get("/")
async def get_snapshot_timeline(
    months:       int          = 12,
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Get the last N months of financial snapshots."""
    snapshots = await get_timeline(db, current_user.id, months=months)
    return snapshots


# ── POST generate snapshot ────────────────────────────────────────────────

@router.post("/generate")
async def generate_snapshot(
    year:         Optional[int] = None,
    month:        Optional[int] = None,
    current_user: User          = Depends(get_current_user),
    db:           AsyncSession  = Depends(get_db),
):
    """
    Manually trigger generation of a financial snapshot.
    If year/month not provided uses current month.
    """
    snapshot = await generate_monthly_snapshot(
        db, current_user.id, year=year, month=month
    )
    return {
        "message":  "Snapshot generated successfully",
        "snapshot": snapshot,
    }