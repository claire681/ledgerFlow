"""Reconciliation admin API - Layer 2 monitoring dashboard endpoints.

Admin-only. Provides visibility into production reconciliation health.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import ReconciliationRun, ReconciliationMismatch, User


router = APIRouter(prefix="/admin/reconciliation", tags=["Admin - Reconciliation"])


# --- Schemas ---------------------------------------------------------

class StatsResponse(BaseModel):
    total_runs: int
    passed_runs: int
    failed_runs: int
    pass_rate_percent: float
    critical_mismatches: int
    warning_mismatches: int
    total_diff_cents: int
    period_days: int


class MismatchResponse(BaseModel):
    id: str
    run_id: str
    field_name: str
    expected_value: float
    actual_value: float
    diff_cents: int
    severity: str
    created_at: datetime

    class Config:
        from_attributes = True


class RunResponse(BaseModel):
    id: str
    pay_stub_id: Optional[str]
    customer_id: Optional[str]
    country: str
    subnational: Optional[str]
    tax_year: int
    engine_version: str
    gross_pay: float
    passed: bool
    mismatch_count: int
    total_diff_cents: int
    checked_at: datetime


class RunDetailResponse(RunResponse):
    payroll_snapshot: dict
    reference_snapshot: dict
    mismatches: list[MismatchResponse]


# --- Helper ----------------------------------------------------------

def _require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for reconciliation dashboard",
        )


# --- Stats -----------------------------------------------------------

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    days: int = Query(7, ge=1, le=90, description="Time window in days"),
    country: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Overall reconciliation health for a time window."""
    _require_admin(current_user)

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Build base filter
    filters = [ReconciliationRun.checked_at >= cutoff]
    if country:
        filters.append(ReconciliationRun.country == country)

    # Total runs
    total_stmt = select(func.count(ReconciliationRun.id)).where(and_(*filters))
    total = (await db.execute(total_stmt)).scalar() or 0

    # Passed vs failed
    passed_stmt = select(func.count(ReconciliationRun.id)).where(and_(*filters, ReconciliationRun.passed == True))
    passed = (await db.execute(passed_stmt)).scalar() or 0

    # Total diff cents
    diff_stmt = select(func.sum(ReconciliationRun.total_diff_cents)).where(and_(*filters))
    total_diff = (await db.execute(diff_stmt)).scalar() or 0

    # Critical + warning mismatch counts
    crit_stmt = select(func.count(ReconciliationMismatch.id)).join(
        ReconciliationRun, ReconciliationRun.id == ReconciliationMismatch.run_id
    ).where(and_(*filters, ReconciliationMismatch.severity == "critical"))
    critical = (await db.execute(crit_stmt)).scalar() or 0

    warn_stmt = select(func.count(ReconciliationMismatch.id)).join(
        ReconciliationRun, ReconciliationRun.id == ReconciliationMismatch.run_id
    ).where(and_(*filters, ReconciliationMismatch.severity == "warning"))
    warning = (await db.execute(warn_stmt)).scalar() or 0

    pass_rate = (passed / total * 100) if total > 0 else 100.0

    return StatsResponse(
        total_runs=total,
        passed_runs=passed,
        failed_runs=total - passed,
        pass_rate_percent=round(pass_rate, 2),
        critical_mismatches=critical,
        warning_mismatches=warning,
        total_diff_cents=total_diff,
        period_days=days,
    )


# --- List runs -------------------------------------------------------

@router.get("/runs", response_model=list[RunResponse])
async def list_runs(
    limit: int = Query(50, ge=1, le=500),
    only_failed: bool = Query(False, description="Show only failed runs"),
    country: Optional[str] = None,
    customer_id: Optional[str] = None,
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List recent reconciliation runs with filters."""
    _require_admin(current_user)

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    filters = [ReconciliationRun.checked_at >= cutoff]
    if only_failed:
        filters.append(ReconciliationRun.passed == False)
    if country:
        filters.append(ReconciliationRun.country == country)
    if customer_id:
        try:
            cid = uuid.UUID(customer_id)
            filters.append(ReconciliationRun.customer_id == cid)
        except ValueError:
            raise HTTPException(400, "Invalid customer_id UUID")

    stmt = select(ReconciliationRun).where(and_(*filters)).order_by(
        ReconciliationRun.checked_at.desc()
    ).limit(limit)
    result = await db.execute(stmt)
    runs = result.scalars().all()

    return [
        RunResponse(
            id=str(r.id),
            pay_stub_id=str(r.pay_stub_id) if r.pay_stub_id else None,
            customer_id=str(r.customer_id) if r.customer_id else None,
            country=r.country,
            subnational=r.subnational,
            tax_year=r.tax_year,
            engine_version=r.engine_version,
            gross_pay=float(r.gross_pay),
            passed=r.passed,
            mismatch_count=r.mismatch_count,
            total_diff_cents=r.total_diff_cents,
            checked_at=r.checked_at,
        )
        for r in runs
    ]


# --- Get one run with detail -----------------------------------------

@router.get("/runs/{run_id}", response_model=RunDetailResponse)
async def get_run(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full detail on one reconciliation run."""
    _require_admin(current_user)

    try:
        rid = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(400, "Invalid run_id UUID")

    run = await db.get(ReconciliationRun, rid)
    if run is None:
        raise HTTPException(404, f"Run {run_id} not found")

    # Get mismatches
    mm_stmt = select(ReconciliationMismatch).where(ReconciliationMismatch.run_id == rid)
    mm_result = await db.execute(mm_stmt)
    mismatches = mm_result.scalars().all()

    return RunDetailResponse(
        id=str(run.id),
        pay_stub_id=str(run.pay_stub_id) if run.pay_stub_id else None,
        customer_id=str(run.customer_id) if run.customer_id else None,
        country=run.country,
        subnational=run.subnational,
        tax_year=run.tax_year,
        engine_version=run.engine_version,
        gross_pay=float(run.gross_pay),
        passed=run.passed,
        mismatch_count=run.mismatch_count,
        total_diff_cents=run.total_diff_cents,
        checked_at=run.checked_at,
        payroll_snapshot=run.payroll_snapshot or {},
        reference_snapshot=run.reference_snapshot or {},
        mismatches=[
            MismatchResponse(
                id=str(m.id),
                run_id=str(m.run_id),
                field_name=m.field_name,
                expected_value=float(m.expected_value),
                actual_value=float(m.actual_value),
                diff_cents=m.diff_cents,
                severity=m.severity,
                created_at=m.created_at,
            )
            for m in mismatches
        ],
    )
