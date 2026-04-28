"""
LedgerFlow Tax Reports Routes
Save, retrieve, and manage tax calculation reports.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import TaxReport, User
from app.services.activity_service import log_activity
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/tax-reports", tags=["Tax Reports"])


# ── Schemas ───────────────────────────────────────────────────────────────

class TaxReportCreate(BaseModel):
    title:           Optional[str]   = None
    tax_year:        Optional[int]   = None
    country:         str
    country_name:    Optional[str]   = None
    province_state:  Optional[str]   = None
    province_name:   Optional[str]   = None
    currency:        Optional[str]   = "USD"
    business_type:   Optional[str]   = None
    revenue:         float           = 0.0
    total_deductions:float           = 0.0
    deductions_json: Optional[dict]  = {}
    taxable_income:  float           = 0.0
    federal_rate:    float           = 0.0
    federal_tax:     float           = 0.0
    state_rate:      float           = 0.0
    state_tax:       float           = 0.0
    corporate_tax:   float           = 0.0
    vat_rate:        float           = 0.0
    vat_tax:         float           = 0.0
    total_tax:       float           = 0.0
    net_profit:      float           = 0.0
    effective_rate:  float           = 0.0
    tax_saved:       float           = 0.0
    full_result_json:Optional[dict]  = {}
    vat_included:    bool            = True
    custom_rate_used:bool            = False
    custom_rate:     Optional[float] = None
    ai_summary:      Optional[str]   = None

    class Config:
        from_attributes = True


class TaxReportResponse(TaxReportCreate):
    id:          str
    user_id:     str
    report_date: Optional[str]      = None
    created_at:  Optional[datetime] = None


# ── LIST reports ──────────────────────────────────────────────────────────

@router.get("/", response_model=list[TaxReportResponse])
async def list_tax_reports(
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """List all saved tax reports for the current user."""
    result = await db.execute(
        select(TaxReport)
        .where(TaxReport.user_id == current_user.id)
        .order_by(desc(TaxReport.created_at))
    )
    return result.scalars().all()


# ── GET single report ─────────────────────────────────────────────────────

@router.get("/{report_id}", response_model=TaxReportResponse)
async def get_tax_report(
    report_id:    str,
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Get a single tax report by ID."""
    result = await db.execute(
        select(TaxReport).where(
            TaxReport.id      == report_id,
            TaxReport.user_id == current_user.id,
        )
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


# ── CREATE report ─────────────────────────────────────────────────────────

@router.post("/", response_model=TaxReportResponse)
async def create_tax_report(
    data:         TaxReportCreate,
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Save a new tax calculation report."""
    report = TaxReport(
        user_id     = current_user.id,
        report_date = datetime.utcnow().strftime("%Y-%m-%d"),
        **data.dict(exclude_unset=True),
    )

    # Auto-generate title if not provided
    if not report.title:
        year  = data.tax_year or datetime.utcnow().year
        cname = data.country_name or data.country
        report.title = f"{cname} Tax Report {year}"

    db.add(report)
    await db.commit()
    await db.refresh(report)

    # Log activity
    await log_activity(
        db, current_user.id,
        action_type = "tax_report_saved",
        page        = "tax_calculator",
        action_data = {
            "report_id":  report.id,
            "country":    data.country,
            "revenue":    data.revenue,
            "total_tax":  data.total_tax,
            "net_profit": data.net_profit,
        },
    )

    return report


# ── DELETE report ─────────────────────────────────────────────────────────

@router.delete("/{report_id}")
async def delete_tax_report(
    report_id:    str,
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Delete a tax report."""
    result = await db.execute(
        select(TaxReport).where(
            TaxReport.id      == report_id,
            TaxReport.user_id == current_user.id,
        )
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    await db.delete(report)
    await db.commit()

    return {"message": "Report deleted successfully"}