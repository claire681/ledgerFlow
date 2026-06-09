"""Pay run lifecycle endpoints.

POST   /payroll/runs                Create a draft pay run
GET    /payroll/runs                List all runs for current user
GET    /payroll/runs/{id}           Get one run
POST   /payroll/runs/preview        Preview a calculation (no DB write)
GET    /payroll/runs/{id}/stubs     List pay stubs for a run
DELETE /payroll/runs/{id}           Delete a draft run

(calculate/finalize/void shipped in the next iteration.)
"""

from decimal import Decimal
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.database import get_db
from app.core.security import get_current_user

from app.models.models import (
    User, PayRun, PayStub, Employee, PayrollSettings,
)
from app.payroll.service import PayrollService
from app.payroll.types import (
    PayRunEmployeeInput,
    JurisdictionContext,
)


router = APIRouter()


# === Request/Response schemas ===

class CreatePayRunRequest(BaseModel):
    pay_period_start: date
    pay_period_end: date
    pay_date: date
    pay_periods_per_year: int = 26
    country: Optional[str] = None
    subnational: Optional[str] = None
    notes: Optional[str] = None


class PayRunResponse(BaseModel):
    id: str
    pay_period_start: date
    pay_period_end: date
    pay_date: date
    status: str
    country: str
    currency: str
    total_gross: Decimal
    total_deductions: Decimal
    total_net: Decimal
    employee_count: int
    finalized_at: Optional[str] = None
    voided_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None


class PreviewRequest(BaseModel):
    pay_period_start: date
    pay_period_end: date
    pay_date: date
    pay_periods_per_year: int = 26
    country: Optional[str] = None
    subnational: Optional[str] = None
    employee_inputs: List[PayRunEmployeeInput]


# === Helpers ===

def _employee_to_dict(emp) -> dict:
    """Convert SQLAlchemy Employee to dict for the service layer."""
    return {
        "id": str(emp.id),
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "personal_email": emp.personal_email,
        "position_title": emp.position_title,
        "pay_type": emp.pay_type,
        "hourly_rate": str(emp.hourly_rate) if emp.hourly_rate is not None else None,
        "salary_amount": str(emp.salary_amount) if emp.salary_amount is not None else "0",
        "currency": emp.currency or "CAD",
        "tax_info": emp.tax_info or {},
        "vacation_pay_pct": "4.0",
    }


def _run_to_response(run: PayRun) -> PayRunResponse:
    return PayRunResponse(
        id=str(run.id),
        pay_period_start=run.pay_period_start,
        pay_period_end=run.pay_period_end,
        pay_date=run.pay_date,
        status=run.status,
        country=run.country,
        currency=run.currency,
        total_gross=run.total_gross,
        total_deductions=run.total_deductions,
        total_net=run.total_net,
        employee_count=run.employee_count,
        finalized_at=run.finalized_at.isoformat() if run.finalized_at else None,
        voided_at=run.voided_at.isoformat() if run.voided_at else None,
        notes=run.notes,
        created_at=run.created_at.isoformat() if run.created_at else None,
    )


# === Endpoints ===

@router.get("/runs", response_model=List[PayRunResponse])
async def list_pay_runs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PayRun)
        .where(PayRun.owner_id == current_user.id)
        .order_by(PayRun.pay_date.desc())
    )
    runs = result.scalars().all()
    return [_run_to_response(r) for r in runs]


@router.post("/runs", response_model=PayRunResponse, status_code=status.HTTP_201_CREATED)
async def create_pay_run(
    body: CreatePayRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings_result = await db.execute(
        select(PayrollSettings).where(PayrollSettings.owner_id == current_user.id)
    )
    settings = settings_result.scalar_one_or_none()

    country = body.country or (settings.country if settings else "CA")
    currency = settings.currency if settings else "CAD"

    new_run = PayRun(
        owner_id=current_user.id,
        pay_period_start=body.pay_period_start,
        pay_period_end=body.pay_period_end,
        pay_date=body.pay_date,
        status="draft",
        country=country,
        currency=currency,
        total_gross=Decimal("0"),
        total_deductions=Decimal("0"),
        total_net=Decimal("0"),
        employee_count=0,
        notes=body.notes,
    )
    db.add(new_run)
    await db.commit()
    await db.refresh(new_run)
    return _run_to_response(new_run)


@router.get("/runs/{run_id}", response_model=PayRunResponse)
async def get_pay_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PayRun).where(
            PayRun.id == run_id, PayRun.owner_id == current_user.id
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Pay run not found")
    return _run_to_response(run)


@router.post("/runs/preview")
async def preview_pay_run(
    body: PreviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Preview a payroll calculation without persisting anything."""
    settings_result = await db.execute(
        select(PayrollSettings).where(PayrollSettings.owner_id == current_user.id)
    )
    settings = settings_result.scalar_one_or_none()

    country = body.country or (settings.country if settings else None)
    if not country:
        raise HTTPException(
            status_code=400,
            detail="Country required (no PayrollSettings configured)",
        )
    subnational = body.subnational or (settings.province_or_state if settings else None)

    jurisdiction = JurisdictionContext(
        country=country,
        subnational=subnational,
        pay_period_start=body.pay_period_start,
        pay_period_end=body.pay_period_end,
        pay_date=body.pay_date,
        pay_periods_per_year=body.pay_periods_per_year,
    )

    # Load employees referenced in the inputs
    employee_ids = [inp.employee_id for inp in body.employee_inputs]
    emp_result = await db.execute(
        select(Employee).where(
            Employee.id.in_(employee_ids),
            Employee.owner_id == current_user.id,
        )
    )
    employees = emp_result.scalars().all()
    employees_by_id = {str(e.id): _employee_to_dict(e) for e in employees}

    # YTD lookups: empty for now (will be added when finalize lands)
    ytd_by_employee_id = {}

    service = PayrollService()
    try:
        preview = service.preview_run(
            employees_by_id=employees_by_id,
            ytd_by_employee_id=ytd_by_employee_id,
            employee_inputs=body.employee_inputs,
            jurisdiction=jurisdiction,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "total_gross": str(preview.total_gross),
        "total_employee_deductions": str(preview.total_employee_deductions),
        "total_employer_contributions": str(preview.total_employer_contributions),
        "total_net": str(preview.total_net),
        "total_remittance_owed": str(preview.total_remittance_owed),
        "employee_count": preview.employee_count,
        "pay_stubs": [stub.model_dump(mode="json") for stub in preview.pay_stubs],
    }


@router.get("/runs/{run_id}/stubs")
async def list_run_stubs(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run_result = await db.execute(
        select(PayRun).where(
            PayRun.id == run_id, PayRun.owner_id == current_user.id
        )
    )
    run = run_result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Pay run not found")

    stubs_result = await db.execute(
        select(PayStub).where(PayStub.pay_run_id == run_id)
    )
    stubs = stubs_result.scalars().all()

    return [
        {
            "id": str(s.id),
            "employee_id": str(s.employee_id),
            "employee_name": s.employee_name,
            "gross_pay": str(s.gross_pay),
            "total_employee_deductions": str(s.total_employee_deductions),
            "net_pay": str(s.net_pay),
            "currency": s.currency,
        }
        for s in stubs
    ]


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pay_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a draft pay run. Finalized runs cannot be deleted (use void)."""
    result = await db.execute(
        select(PayRun).where(
            PayRun.id == run_id, PayRun.owner_id == current_user.id
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Pay run not found")

    if run.status == "finalized":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a finalized pay run. Use void instead.",
        )

    await db.delete(run)
    await db.commit()
