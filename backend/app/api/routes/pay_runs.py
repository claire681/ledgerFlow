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
from datetime import date, datetime, timezone
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel

from app.db.database import get_db
from app.core.security import get_current_user

from app.models.models import (
    User, PayRun, PayStub, Employee, PayrollSettings,
    YTDBalance, PayrollAuditLog,
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


# ============================================================
# Calculate / Finalize / Void requests
# ============================================================

class CalculateRequest(BaseModel):
    """Body for POST /runs/{id}/calculate.

    employee_inputs: hours and extras per employee in the run.
    pay_periods_per_year: override settings default if provided.
    subnational: override settings.province_or_state if provided.
    """
    employee_inputs: List[PayRunEmployeeInput]
    pay_periods_per_year: Optional[int] = None
    subnational: Optional[str] = None


class VoidRequest(BaseModel):
    reason: str


# ============================================================
# Helpers
# ============================================================

PAY_FREQUENCY_TO_PERIODS = {
    "weekly": 52,
    "bi_weekly": 26,
    "biweekly": 26,
    "semi_monthly": 24,
    "semimonthly": 24,
    "monthly": 12,
}


def _periods_per_year(settings, override: Optional[int]) -> int:
    if override:
        return override
    if settings and settings.default_pay_schedule:
        return PAY_FREQUENCY_TO_PERIODS.get(settings.default_pay_schedule.lower(), 26)
    return 26


def _jurisdiction_key(country: str, subnational: Optional[str]) -> str:
    return f"{country}-{subnational}" if subnational else country


def _ytd_to_dict(ytd: Optional[YTDBalance]) -> Dict[str, Any]:
    if ytd is None:
        return {}
    return {
        "ytd_gross": ytd.ytd_gross,
        "ytd_federal_tax": ytd.ytd_federal_tax,
        "ytd_provincial_or_state_tax": ytd.ytd_provincial_or_state_tax,
        "ytd_social_security_employee": ytd.ytd_social_security_employee,
        "ytd_social_security_employer": ytd.ytd_social_security_employer,
        "ytd_unemployment_employee": ytd.ytd_unemployment_employee,
        "ytd_unemployment_employer": ytd.ytd_unemployment_employer,
        "ytd_pensionable_earnings": ytd.ytd_pensionable_earnings,
        "ytd_insurable_earnings": ytd.ytd_insurable_earnings,
    }


def _apply_ytd_delta(ytd: YTDBalance, stub: PayStub) -> None:
    """Add this pay stub's amounts to the YTD balance."""
    ytd.ytd_gross = (ytd.ytd_gross or Decimal("0")) + stub.gross_pay
    ytd.ytd_federal_tax = (ytd.ytd_federal_tax or Decimal("0")) + stub.federal_tax
    ytd.ytd_provincial_or_state_tax = (
        (ytd.ytd_provincial_or_state_tax or Decimal("0"))
        + stub.provincial_or_state_tax
    )
    ytd.ytd_social_security_employee = (
        (ytd.ytd_social_security_employee or Decimal("0"))
        + stub.social_security_employee
    )
    ytd.ytd_social_security_employer = (
        (ytd.ytd_social_security_employer or Decimal("0"))
        + stub.social_security_employer
    )
    ytd.ytd_unemployment_employee = (
        (ytd.ytd_unemployment_employee or Decimal("0"))
        + stub.unemployment_employee
    )
    ytd.ytd_unemployment_employer = (
        (ytd.ytd_unemployment_employer or Decimal("0"))
        + stub.unemployment_employer
    )
    # Pensionable + insurable from snapshot (engine-dependent)
    snap = stub.calculation_snapshot or {}
    pensionable_after = (
        snap.get("cpp", {}).get("ytd_pensionable_after")
        if isinstance(snap.get("cpp"), dict) else None
    )
    if pensionable_after:
        ytd.ytd_pensionable_earnings = Decimal(str(pensionable_after))

    insurable_after = (
        (snap.get("ei", {}) or {}).get("ytd_insurable_after")
        or (snap.get("fica", {}) or {}).get("new_ytd_medicare")
    )
    if insurable_after:
        ytd.ytd_insurable_earnings = Decimal(str(insurable_after))


def _reverse_ytd_delta(ytd: YTDBalance, stub: PayStub) -> None:
    """Subtract this stub's amounts from YTD (used on void)."""
    ytd.ytd_gross = (ytd.ytd_gross or Decimal("0")) - stub.gross_pay
    ytd.ytd_federal_tax = (ytd.ytd_federal_tax or Decimal("0")) - stub.federal_tax
    ytd.ytd_provincial_or_state_tax = (
        (ytd.ytd_provincial_or_state_tax or Decimal("0"))
        - stub.provincial_or_state_tax
    )
    ytd.ytd_social_security_employee = (
        (ytd.ytd_social_security_employee or Decimal("0"))
        - stub.social_security_employee
    )
    ytd.ytd_social_security_employer = (
        (ytd.ytd_social_security_employer or Decimal("0"))
        - stub.social_security_employer
    )
    ytd.ytd_unemployment_employee = (
        (ytd.ytd_unemployment_employee or Decimal("0"))
        - stub.unemployment_employee
    )
    ytd.ytd_unemployment_employer = (
        (ytd.ytd_unemployment_employer or Decimal("0"))
        - stub.unemployment_employer
    )


# ============================================================
# POST /runs/{id}/calculate
# ============================================================

@router.post("/runs/{run_id}/calculate")
async def calculate_pay_run(
    run_id: UUID,
    body: CalculateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Calculate a pay run and persist pay stubs as draft.

    Idempotent: re-running replaces existing stubs for this run.
    Cannot be called on finalized or voided runs.
    """
    # Load run
    run_result = await db.execute(
        select(PayRun).where(
            PayRun.id == run_id, PayRun.owner_id == current_user.id
        )
    )
    run = run_result.scalar_one_or_none()
    if not run:
        raise HTTPException(404, "Pay run not found")
    if run.status != "draft":
        raise HTTPException(
            400, f"Cannot calculate a run with status '{run.status}' (must be draft)"
        )

    # Load settings
    settings_result = await db.execute(
        select(PayrollSettings).where(PayrollSettings.owner_id == current_user.id)
    )
    settings = settings_result.scalar_one_or_none()

    pay_periods = _periods_per_year(settings, body.pay_periods_per_year)
    subnational = body.subnational or (
        settings.province_or_state if settings else None
    )

    jurisdiction = JurisdictionContext(
        country=run.country,
        subnational=subnational,
        pay_period_start=run.pay_period_start,
        pay_period_end=run.pay_period_end,
        pay_date=run.pay_date,
        pay_periods_per_year=pay_periods,
    )

    # Load employees
    employee_ids = [inp.employee_id for inp in body.employee_inputs]
    emp_result = await db.execute(
        select(Employee).where(
            Employee.id.in_(employee_ids),
            Employee.owner_id == current_user.id,
        )
    )
    employees = emp_result.scalars().all()
    employees_by_id = {str(e.id): _employee_to_dict(e) for e in employees}

    # Load YTD balances (calendar year for v1)
    tax_year = run.pay_period_start.year
    jurisdiction_key = _jurisdiction_key(run.country, subnational)

    ytd_result = await db.execute(
        select(YTDBalance).where(
            YTDBalance.employee_id.in_(employee_ids),
            YTDBalance.tax_year == tax_year,
            YTDBalance.jurisdiction == jurisdiction_key,
        )
    )
    ytd_by_emp = {str(y.employee_id): _ytd_to_dict(y) for y in ytd_result.scalars().all()}

    # Calculate
    service = PayrollService()
    try:
        preview = service.preview_run(
            employees_by_id=employees_by_id,
            ytd_by_employee_id=ytd_by_emp,
            employee_inputs=body.employee_inputs,
            jurisdiction=jurisdiction,
            pay_run_id=str(run.id),
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Preserve any existing memos before wiping so they survive recalculation
    existing_memos_result = await db.execute(
        select(PayStub.employee_id, PayStub.memo)
        .where(PayStub.pay_run_id == run_id, PayStub.memo.isnot(None))
    )
    existing_memos = {str(r.employee_id): r.memo for r in existing_memos_result.all()}

    # Wipe existing pay stubs for this run, then insert fresh
    await db.execute(delete(PayStub).where(PayStub.pay_run_id == run_id))

    for stub in preview.pay_stubs:
        new_stub = PayStub(
            pay_run_id=run.id,
            employee_id=UUID(stub.employee_id),
            employee_name=stub.employee_name,
            employee_email=stub.employee_email,
            position_title=stub.position_title,
            pay_type=stub.pay_type,
            hourly_rate=stub.hourly_rate,
            salary_amount=stub.salary_amount,
            currency=stub.currency,
            hours_regular=stub.hours_regular,
            hours_overtime=stub.hours_overtime,
            hours_stat_holiday=stub.hours_stat_holiday,
            hours_vacation=stub.hours_vacation,
            hours_sick=stub.hours_sick,
            hours_evening=stub.hours_evening,
            hours_overnight=stub.hours_overnight,
            hours_weekend=stub.hours_weekend,
            hours_on_call=stub.hours_on_call,
            hours_travel=stub.hours_travel,
            gross_pay=stub.gross_pay,
            bonus=stub.bonus,
            commission=stub.commission,
            reimbursement=stub.reimbursement,
            federal_tax=stub.federal_tax,
            provincial_or_state_tax=stub.provincial_or_state_tax,
            local_tax=stub.local_tax,
            social_security_employee=stub.social_security_employee,
            social_security_2_employee=stub.social_security_2_employee,
            unemployment_employee=stub.unemployment_employee,
            other_employee_deductions=dict(stub.other_employee_deductions),
            total_employee_deductions=stub.total_employee_deductions,
            social_security_employer=stub.social_security_employer,
            unemployment_employer=stub.unemployment_employer,
            workers_comp_employer=stub.workers_comp_employer,
            other_employer_contributions=dict(stub.other_employer_contributions),
            total_employer_contributions=stub.total_employer_contributions,
            net_pay=stub.net_pay,
            calculation_snapshot=dict(stub.calculation_snapshot),
        )
        # Restore memo if this employee had one from a previous calculation
        preserved_memo = existing_memos.get(str(stub.employee_id))
        if preserved_memo:
            new_stub.memo = preserved_memo
        db.add(new_stub)

    # Update run totals
    run.total_gross = preview.total_gross
    run.total_deductions = preview.total_employee_deductions
    run.total_net = preview.total_net
    run.total_employer_contributions = preview.total_employer_contributions
    run.total_remittance_owed = preview.total_remittance_owed
    run.employee_count = preview.employee_count

    await db.commit()
    await db.refresh(run)

    # Compute change_in_gross_pct: compare each employee's gross to their
    # most recent previous pay stub (any prior pay run of this owner).
    # If no previous stub exists, change is None (Preview shows "New").
    current_employee_ids = [str(s.employee_id) for s in preview.pay_stubs]
    prev_gross_by_emp = {}
    if current_employee_ids:
        prev_result = await db.execute(
            select(PayStub.employee_id, PayStub.gross_pay, PayStub.created_at)
            .where(
                PayStub.employee_id.in_(current_employee_ids),
                PayStub.pay_run_id != run.id,
            )
            .order_by(PayStub.employee_id, PayStub.created_at.desc())
        )
        seen = set()
        for row in prev_result.all():
            emp_id = str(row.employee_id)
            if emp_id in seen:
                continue
            seen.add(emp_id)
            prev_gross_by_emp[emp_id] = Decimal(str(row.gross_pay))

    def _change_pct(current_gross, employee_id):
        prev = prev_gross_by_emp.get(str(employee_id))
        if prev is None or prev == 0:
            return None
        return float((Decimal(str(current_gross)) - prev) / prev)

    # Re-fetch persisted stubs so we have DB ids and memo values
    saved_stubs_result = await db.execute(
        select(PayStub)
        .where(PayStub.pay_run_id == run.id)
        .order_by(PayStub.created_at)
    )
    saved_stubs = saved_stubs_result.scalars().all()

    run_response = _run_to_response(run)
    return {
        **run_response.model_dump(),
        "stubs": [
            {
                "id": str(stub.id),
                "employee_id": str(stub.employee_id),
                "memo": stub.memo,
                "change_in_gross_pct": _change_pct(stub.gross_pay, stub.employee_id),
                "employee_name": stub.employee_name,
                "position_title": stub.position_title,
                "pay_type": stub.pay_type,
                "hourly_rate": str(stub.hourly_rate) if stub.hourly_rate is not None else None,
                "salary_amount": str(stub.salary_amount) if stub.salary_amount is not None else None,
                "hours_regular": str(stub.hours_regular),
                "hours_overtime": str(stub.hours_overtime),
                "hours_stat_holiday": str(stub.hours_stat_holiday),
                "hours_vacation": str(stub.hours_vacation),
                "hours_sick": str(stub.hours_sick),
                "gross_pay": str(stub.gross_pay),
                "federal_tax": str(stub.federal_tax),
                "provincial_or_state_tax": str(stub.provincial_or_state_tax),
                "social_security_employee": str(stub.social_security_employee),
                "social_security_2_employee": str(stub.social_security_2_employee),
                "unemployment_employee": str(stub.unemployment_employee),
                "total_employee_deductions": str(stub.total_employee_deductions),
                "social_security_employer": str(stub.social_security_employer),
                "unemployment_employer": str(stub.unemployment_employer),
                "total_employer_contributions": str(stub.total_employer_contributions),
                "net_pay": str(stub.net_pay),
            }
            for stub in saved_stubs
        ],
    }




# ============================================================
# PATCH /stubs/{stub_id}/memo
# ============================================================

class UpdateStubMemoRequest(BaseModel):
    memo: Optional[str] = None


@router.patch("/stubs/{stub_id}/memo")
async def update_stub_memo(
    stub_id: UUID,
    body: UpdateStubMemoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the memo field on a single pay stub.

    Verifies ownership via pay run, then updates memo (max 500 chars).
    """
    result = await db.execute(
        select(PayStub, PayRun)
        .join(PayRun, PayStub.pay_run_id == PayRun.id)
        .where(
            PayStub.id == stub_id,
            PayRun.owner_id == current_user.id,
        )
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Pay stub not found")

    stub = row[0]
    memo = (body.memo or "").strip()
    if len(memo) > 500:
        memo = memo[:500]
    stub.memo = memo if memo else None

    await db.commit()
    await db.refresh(stub)

    return {"id": str(stub.id), "memo": stub.memo}

# ============================================================
# POST /runs/{id}/finalize
# ============================================================

@router.post("/runs/{run_id}/finalize", response_model=PayRunResponse)
async def finalize_pay_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Finalize a pay run: lock it, update YTD balances, write audit log."""
    run_result = await db.execute(
        select(PayRun).where(
            PayRun.id == run_id, PayRun.owner_id == current_user.id
        )
    )
    run = run_result.scalar_one_or_none()
    if not run:
        raise HTTPException(404, "Pay run not found")
    if run.status != "draft":
        raise HTTPException(
            400, f"Only draft runs can be finalized (current: '{run.status}')"
        )

    stubs_result = await db.execute(
        select(PayStub).where(PayStub.pay_run_id == run_id)
    )
    stubs = stubs_result.scalars().all()
    if not stubs:
        raise HTTPException(
            400, "No pay stubs found. Call /calculate first."
        )

    tax_year = run.pay_period_start.year

    for stub in stubs:
        snap = stub.calculation_snapshot or {}
        country = snap.get("country", run.country)
        subnational = snap.get("subnational")
        jurisdiction_key = _jurisdiction_key(country, subnational)

        ytd_result = await db.execute(
            select(YTDBalance).where(
                YTDBalance.employee_id == stub.employee_id,
                YTDBalance.tax_year == tax_year,
                YTDBalance.jurisdiction == jurisdiction_key,
            )
        )
        ytd = ytd_result.scalar_one_or_none()

        if ytd is None:
            ytd = YTDBalance(
                employee_id=stub.employee_id,
                tax_year=tax_year,
                jurisdiction=jurisdiction_key,
            )
            db.add(ytd)

        _apply_ytd_delta(ytd, stub)
        ytd.last_pay_run_id = run.id

    # Lock the run
    run.status = "finalized"
    run.finalized_at = datetime.now(timezone.utc)
    run.finalized_by_user_id = current_user.id

    # Audit
    audit = PayrollAuditLog(
        owner_id=current_user.id,
        entity_type="pay_run",
        entity_id=run.id,
        action="finalized",
        actor_user_id=current_user.id,
        actor_role="admin",
        before_state={"status": "draft"},
        after_state={
            "status": "finalized",
            "employee_count": run.employee_count,
            "total_net": str(run.total_net),
        },
        notes=f"Finalized {len(stubs)} pay stubs",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(run)
    return _run_to_response(run)




# ============================================================
# GET /runs/{id}/done-view - full data for the "Pay run done" page
# ============================================================

@router.get("/runs/{run_id}/done-view")
async def get_pay_run_done_view(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return everything the Done page needs in one response.

    Includes: run summary + per-employee stubs enriched with employee
    address, YTD balances by tax type, and totals summary.
    """
    # Load the run
    run_result = await db.execute(
        select(PayRun).where(
            PayRun.id == run_id,
            PayRun.owner_id == current_user.id,
        )
    )
    run = run_result.scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=404, detail="Pay run not found")

    # Load stubs for this run
    stubs_result = await db.execute(
        select(PayStub)
        .where(PayStub.pay_run_id == run_id)
        .order_by(PayStub.employee_name)
    )
    stubs = stubs_result.scalars().all()

    # Load employees (for address, bank info)
    employee_ids = [s.employee_id for s in stubs]
    emp_result = await db.execute(
        select(Employee).where(Employee.id.in_(employee_ids))
    )
    employees_by_id = {str(e.id): e for e in emp_result.scalars().all()}

    # Load YTD balances (calendar year)
    tax_year = run.pay_period_start.year
    ytd_result = await db.execute(
        select(YTDBalance).where(
            YTDBalance.employee_id.in_(employee_ids),
            YTDBalance.tax_year == tax_year,
        )
    )
    ytd_by_employee = {str(y.employee_id): y for y in ytd_result.scalars().all()}

    # Build employee entries
    employees_data = []
    for stub in stubs:
        emp = employees_by_id.get(str(stub.employee_id))
        ytd = ytd_by_employee.get(str(stub.employee_id))

        # Address strings
        address_line1 = emp.address_line1 if emp else None
        address_parts = []
        if emp:
            if emp.city:
                address_parts.append(emp.city)
            if emp.province_or_state:
                address_parts.append(emp.province_or_state)
            if emp.postal_or_zip:
                address_parts.append(emp.postal_or_zip)
        address_line2 = ", ".join(address_parts) if address_parts else None

        # Employee taxes (current + YTD)
        employee_taxes = [
            {
                "type": "Canada Pension Plan",
                "current": str(stub.social_security_employee),
                "ytd": str(ytd.ytd_social_security_employee) if ytd else "0.00",
            },
            {
                "type": "Employment Insurance",
                "current": str(stub.unemployment_employee),
                "ytd": str(ytd.ytd_unemployment_employee) if ytd else "0.00",
            },
            {
                "type": "Income Tax",
                "current": str(stub.federal_tax + stub.provincial_or_state_tax),
                "ytd": str((ytd.ytd_federal_tax + ytd.ytd_provincial_or_state_tax)) if ytd else "0.00",
            },
            {
                "type": "Second Canada Pension Plan",
                "current": str(stub.social_security_2_employee),
                "ytd": "0.00",
            },
        ]

        # Employer contributions (current + YTD)
        employer_contributions = [
            {
                "type": "Employment Insurance Employer",
                "current": str(stub.unemployment_employer),
                "ytd": str(ytd.ytd_unemployment_employer) if ytd else "0.00",
            },
            {
                "type": "Canada Pension Plan Employer",
                "current": str(stub.social_security_employer),
                "ytd": str(ytd.ytd_social_security_employer) if ytd else "0.00",
            },
            {
                "type": "Second Canada Pension Plan Employer",
                "current": "0.00",
                "ytd": "0.00",
            },
        ]

        # Pay lines: derive from hours
        pay_lines = []
        if stub.hours_regular and float(stub.hours_regular) > 0:
            rate = float(stub.hourly_rate) if stub.hourly_rate else 0
            pay_lines.append({
                "type": "Regular Pay",
                "hours": str(stub.hours_regular),
                "rate": str(stub.hourly_rate) if stub.hourly_rate else "0",
                "current": str(round(float(stub.hours_regular) * rate, 2)),
                "ytd": str(ytd.ytd_gross) if ytd else "0.00",
            })
        if stub.hours_overtime and float(stub.hours_overtime) > 0:
            rate = float(stub.hourly_rate) * 1.5 if stub.hourly_rate else 0
            pay_lines.append({
                "type": "Overtime Pay",
                "hours": str(stub.hours_overtime),
                "rate": str(round(rate, 2)),
                "current": str(round(float(stub.hours_overtime) * rate, 2)),
                "ytd": "0.00",
            })
        if stub.hours_stat_holiday and float(stub.hours_stat_holiday) > 0:
            rate = float(stub.hourly_rate) if stub.hourly_rate else 0
            pay_lines.append({
                "type": "Statutory Holiday Pay",
                "hours": str(stub.hours_stat_holiday),
                "rate": str(stub.hourly_rate) if stub.hourly_rate else "0",
                "current": str(round(float(stub.hours_stat_holiday) * rate, 2)),
                "ytd": "0.00",
            })

        employees_data.append({
            "stub_id": str(stub.id),
            "employee_id": str(stub.employee_id),
            "name": stub.employee_name,
            "position_title": stub.position_title,
            "payment_method": "Paper cheque",
            "is_cheque": True,
            "address_line1": address_line1,
            "address_line2": address_line2,
            "paid_from": (emp.bank_name if emp and emp.bank_name else "Employer bank account"),
            "paid_by": f"cheque (${stub.net_pay})",
            "gross_pay": str(stub.gross_pay),
            "employee_deductions": str(stub.total_employee_deductions),
            "employer_cost": str(stub.total_employer_contributions),
            "net_pay": str(stub.net_pay),
            "memo": stub.memo,
            "pay_lines": pay_lines,
            "employee_taxes": employee_taxes,
            "employer_contributions": employer_contributions,
        })

    # Totals
    cheque_count = len(employees_data)  # all cheque for now
    deposit_count = 0
    total_cost = float(run.total_net or 0) + float(run.total_deductions or 0) + float(run.total_employer_contributions or 0)

    return {
        "run": {
            "id": str(run.id),
            "status": run.status,
            "pay_period_start": run.pay_period_start.isoformat() if run.pay_period_start else None,
            "pay_period_end": run.pay_period_end.isoformat() if run.pay_period_end else None,
            "pay_date": run.pay_date.isoformat() if run.pay_date else None,
            "currency": run.currency,
            "total_gross": str(run.total_gross),
            "total_deductions": str(run.total_deductions),
            "total_net": str(run.total_net),
            "total_employer_contributions": str(run.total_employer_contributions or 0),
            "finalized_at": run.finalized_at.isoformat() if run.finalized_at else None,
        },
        "employees": employees_data,
        "totals": {
            "employees_paid": len(employees_data),
            "cheque_count": cheque_count,
            "deposit_count": deposit_count,
            "employee_take_home": str(run.total_net),
            "total_cost": f"{total_cost:.2f}",
            "employee_tax": str(run.total_deductions),
            "employer_tax": str(run.total_employer_contributions or 0),
        },
    }



# ============================================================
# GET /paycheques - list all paycheques (pay stubs) for the user
# ============================================================

@router.get("/paycheques")
async def list_paycheques(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all paycheques (pay stubs) belonging to the current user.

    Returns each pay stub joined with its pay run for the pay_date and
    run-level status. Only stubs from finalized or voided runs appear;
    stubs from draft runs are hidden (they haven't been issued yet).
    """
    result = await db.execute(
        select(PayStub, PayRun)
        .join(PayRun, PayStub.pay_run_id == PayRun.id)
        .where(
            PayRun.owner_id == current_user.id,
            PayRun.status.in_(["finalized", "voided"]),
        )
        .order_by(PayRun.pay_date.desc(), PayStub.employee_name)
    )
    rows = result.all()

    paycheques = []
    for stub, run in rows:
        # Map to paycheque status. A stub-level void takes precedence.
        pc_status = "voided" if (stub.voided or run.status == "voided") else "issued"

        paycheques.append({
            "id": str(stub.id),
            "employee_id": str(stub.employee_id),
            "name": stub.employee_name,
            "employee_name": stub.employee_name,
            "pay_date": run.pay_date.isoformat() if run.pay_date else None,
            "pay_period_start": run.pay_period_start.isoformat() if run.pay_period_start else None,
            "pay_period_end": run.pay_period_end.isoformat() if run.pay_period_end else None,
            "total": str(stub.gross_pay),
            "gross_pay": str(stub.gross_pay),
            "net": str(stub.net_pay),
            "net_pay": str(stub.net_pay),
            "pay_method": "cheque",  # defaults per current strategy
            "cheque_number": None,  # not stored yet
            "status": pc_status,
            "currency": run.currency,
            "pay_run_id": str(run.id),
            "memo": stub.memo,
        })

    return paycheques



# ============================================================
# GET /paycheques/{stub_id} - full detail for one paycheque
# ============================================================

@router.get("/paycheques/{stub_id}")
async def get_paycheque_detail(
    stub_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return full detail for a single paycheque (pay stub).

    Response shape matches what PaychequeDetail.js expects:
    nested pay / employee_taxes / employer_taxes objects each with
    lines[] and total {current, ytd}.
    """
    result = await db.execute(
        select(PayStub, PayRun)
        .join(PayRun, PayStub.pay_run_id == PayRun.id)
        .where(
            PayStub.id == stub_id,
            PayRun.owner_id == current_user.id,
        )
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Paycheque not found")
    stub, run = row

    # Employee for address + bank
    emp_result = await db.execute(
        select(Employee).where(Employee.id == stub.employee_id)
    )
    emp = emp_result.scalar_one_or_none()

    # YTD balances
    tax_year = run.pay_period_start.year
    ytd_result = await db.execute(
        select(YTDBalance).where(
            YTDBalance.employee_id == stub.employee_id,
            YTDBalance.tax_year == tax_year,
        )
    )
    ytd = ytd_result.scalar_one_or_none()

    # Employer for pay stub header
    from app.models.models import CompanyProfile
    company_res = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == current_user.id)
    )
    company = company_res.scalar_one_or_none()

    # Address
    address_parts = []
    if emp:
        if emp.address_line1:
            address_parts.append(emp.address_line1)
        city_prov_postal = []
        if emp.city: city_prov_postal.append(emp.city)
        if emp.province_or_state: city_prov_postal.append(emp.province_or_state)
        if emp.postal_or_zip: city_prov_postal.append(emp.postal_or_zip)
        if city_prov_postal:
            address_parts.append(", ".join(city_prov_postal))
    address = "\n".join(address_parts) if address_parts else None

    # Pay lines
    pay_lines = []
    if stub.hours_regular and float(stub.hours_regular) > 0:
        rate = float(stub.hourly_rate) if stub.hourly_rate else 0
        pay_lines.append({
            "type": "Regular Pay",
            "hours": str(stub.hours_regular),
            "rate": str(stub.hourly_rate) if stub.hourly_rate else "0",
            "current": str(round(float(stub.hours_regular) * rate, 2)),
            "ytd": str(ytd.ytd_gross) if ytd else "0.00",
        })
    if stub.hours_overtime and float(stub.hours_overtime) > 0:
        rate = float(stub.hourly_rate) * 1.5 if stub.hourly_rate else 0
        pay_lines.append({
            "type": "Overtime Pay",
            "hours": str(stub.hours_overtime),
            "rate": str(round(rate, 2)),
            "current": str(round(float(stub.hours_overtime) * rate, 2)),
            "ytd": "0.00",
        })
    if stub.hours_stat_holiday and float(stub.hours_stat_holiday) > 0:
        rate = float(stub.hourly_rate) if stub.hourly_rate else 0
        pay_lines.append({
            "type": "Stat Holiday Pay",
            "hours": str(stub.hours_stat_holiday),
            "rate": str(stub.hourly_rate) if stub.hourly_rate else "0",
            "current": str(round(float(stub.hours_stat_holiday) * rate, 2)),
            "ytd": "0.00",
        })

    pay_total = {
        "current": str(stub.gross_pay),
        "ytd": str(ytd.ytd_gross) if ytd else "0.00",
    }

    # Employee taxes
    emp_tax_lines = [
        {"type": "Canada Pension Plan", "current": str(stub.social_security_employee), "ytd": str(ytd.ytd_social_security_employee) if ytd else "0.00"},
        {"type": "Employment Insurance", "current": str(stub.unemployment_employee), "ytd": str(ytd.ytd_unemployment_employee) if ytd else "0.00"},
        {"type": "Income Tax", "current": str(stub.federal_tax + stub.provincial_or_state_tax), "ytd": str((ytd.ytd_federal_tax + ytd.ytd_provincial_or_state_tax)) if ytd else "0.00"},
        {"type": "Second Canada Pension Plan", "current": str(stub.social_security_2_employee), "ytd": "0.00"},
    ]
    emp_tax_total = {
        "current": str(stub.total_employee_deductions),
        "ytd": str((ytd.ytd_social_security_employee + ytd.ytd_unemployment_employee + ytd.ytd_federal_tax + ytd.ytd_provincial_or_state_tax)) if ytd else "0.00",
    }

    # Employer taxes
    er_tax_lines = [
        {"type": "Employment Insurance Employer", "current": str(stub.unemployment_employer), "ytd": str(ytd.ytd_unemployment_employer) if ytd else "0.00"},
        {"type": "Canada Pension Plan Employer", "current": str(stub.social_security_employer), "ytd": str(ytd.ytd_social_security_employer) if ytd else "0.00"},
        {"type": "Second Canada Pension Plan Employer", "current": "0.00", "ytd": "0.00"},
    ]
    er_tax_total = {
        "current": str(stub.total_employer_contributions or 0),
        "ytd": str((ytd.ytd_social_security_employer + ytd.ytd_unemployment_employer)) if ytd else "0.00",
    }

    pc_status = "voided" if (stub.voided or run.status == "voided") else "issued"

    return {
        "id": str(stub.id),
        "employee_id": str(stub.employee_id),
        "employee_name": stub.employee_name,
        "employee_address": address,
        "position_title": stub.position_title,
        "pay_date": run.pay_date.isoformat() if run.pay_date else None,
        "pay_period_start": run.pay_period_start.isoformat() if run.pay_period_start else None,
        "pay_period_end": run.pay_period_end.isoformat() if run.pay_period_end else None,
        "paid_from": emp.bank_name if emp and emp.bank_name else "Employer bank account",
        "pay_method": "cheque",
        "cheque_number": None,
        "gross_pay": str(stub.gross_pay),
        "total_pay": str(stub.gross_pay),
        "net_pay": str(stub.net_pay),
        "currency": run.currency,
        "memo": stub.memo,
        "status": pc_status,
        "pay_run_id": str(run.id),
        "employer": {
            "name": company.company_name if company else None,
            "business_number": company.business_number if company else None,
            "payroll_rp_account": company.payroll_rp_account if company else None,
            "address_street": company.address_street if company else None,
            "address_city": company.address_city if company else None,
            "address_province": company.province_state if company else None,
            "address_postal_code": company.address_postal_code if company else None,
        } if company else None,
        "pay": {"lines": pay_lines, "total": pay_total},
        "employee_taxes": {"lines": emp_tax_lines, "total": emp_tax_total},
        "employer_taxes": {"lines": er_tax_lines, "total": er_tax_total},
        "deductions_contributions": {"lines": [], "total": None},
    }





# ============================================================
# GET /paycheques/{stub_id}/pdf - PDF pay stub
# ============================================================

@router.get("/paycheques/{stub_id}/pdf")
async def get_paycheque_pdf(
    stub_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a PDF pay stub for the given stub.

    Uses WeasyPrint to render an HTML template to PDF. Returns the
    raw PDF as application/pdf. Frontend can open it in a new tab
    or trigger download.
    """
    from weasyprint import HTML
    from jinja2 import Environment, FileSystemLoader
    from fastapi.responses import Response
    from datetime import datetime
    from app.models.models import CompanyProfile
    import os

    # Fetch pay stub + pay run
    result = await db.execute(
        select(PayStub, PayRun)
        .join(PayRun, PayStub.pay_run_id == PayRun.id)
        .where(
            PayStub.id == stub_id,
            PayRun.owner_id == current_user.id,
        )
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Paycheque not found")
    stub, run = row

    # Employee
    emp_result = await db.execute(select(Employee).where(Employee.id == stub.employee_id))
    emp = emp_result.scalar_one_or_none()

    # Employer (company profile)
    company_res = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == current_user.id)
    )
    company = company_res.scalar_one_or_none()

    # YTD
    tax_year = run.pay_period_start.year
    ytd_result = await db.execute(
        select(YTDBalance).where(
            YTDBalance.employee_id == stub.employee_id,
            YTDBalance.tax_year == tax_year,
        )
    )
    ytd = ytd_result.scalar_one_or_none()

    # Money formatter
    def money(v, symbol=False):
        n = float(v or 0)
        body = f"{abs(n):,.2f}"
        sign = "-" if n < 0 else ""
        return f"{sign}${body}" if symbol else f"{sign}{body}"

    def num(v):
        return f"{float(v or 0):,.2f}"

    def fmt_date(d):
        if d is None:
            return ""
        return d.strftime("%d-%m-%Y")

    # Employer lines
    employer_name = company.company_name if company else ""
    employer_line1 = company.address_street if company else ""
    parts = []
    if company:
        if company.address_city:
            parts.append(company.address_city)
        if company.province_state:
            parts.append(company.province_state)
        if company.address_postal_code:
            parts.append(company.address_postal_code)
    employer_line2 = " ".join(parts)

    # Employee address
    address_parts = []
    if emp:
        if emp.address_line1:
            address_parts.append(emp.address_line1)
        cpp = []
        if emp.city: cpp.append(emp.city)
        if emp.province_or_state: cpp.append(emp.province_or_state)
        if emp.postal_or_zip: cpp.append(emp.postal_or_zip)
        if cpp:
            address_parts.append(", ".join(cpp))
    employee_line1 = address_parts[0] if len(address_parts) > 0 else ""
    employee_line2 = address_parts[1] if len(address_parts) > 1 else ""

    # Pay lines
    earnings = []
    total_hours = 0
    if stub.hours_regular and float(stub.hours_regular) > 0:
        rate = float(stub.hourly_rate or 0)
        earnings.append({
            "type": "Regular Pay",
            "hours": num(stub.hours_regular),
            "rate": num(stub.hourly_rate),
            "current": money(float(stub.hours_regular) * rate),
            "ytd": money(ytd.ytd_gross if ytd else 0),
        })
        total_hours += float(stub.hours_regular)
    if stub.hours_overtime and float(stub.hours_overtime) > 0:
        rate = float(stub.hourly_rate or 0) * 1.5
        earnings.append({
            "type": "Overtime Pay",
            "hours": num(stub.hours_overtime),
            "rate": num(rate),
            "current": money(float(stub.hours_overtime) * rate),
            "ytd": money(0),
        })
        total_hours += float(stub.hours_overtime)
    if stub.hours_stat_holiday and float(stub.hours_stat_holiday) > 0:
        rate = float(stub.hourly_rate or 0)
        earnings.append({
            "type": "Stat Holiday Pay",
            "hours": num(stub.hours_stat_holiday),
            "rate": num(stub.hourly_rate),
            "current": money(float(stub.hours_stat_holiday) * rate),
            "ytd": money(0),
        })
        total_hours += float(stub.hours_stat_holiday)

    # Taxes
    taxes = [
        {"type": "Canada Pension Plan", "current": money(stub.social_security_employee), "ytd": money(ytd.ytd_social_security_employee if ytd else 0)},
        {"type": "Employment Insurance", "current": money(stub.unemployment_employee), "ytd": money(ytd.ytd_unemployment_employee if ytd else 0)},
        {"type": "Income Tax", "current": money(stub.federal_tax + stub.provincial_or_state_tax), "ytd": money((ytd.ytd_federal_tax + ytd.ytd_provincial_or_state_tax) if ytd else 0)},
        {"type": "Second Canada Pension Plan", "current": money(stub.social_security_2_employee), "ytd": money(0)},
    ]

    # Summary
    total_pay_current = float(stub.gross_pay or 0)
    total_taxes_current = float(stub.total_employee_deductions or 0)
    deductions_current = 0

    # Load template
    template_dir = os.path.join(os.path.dirname(__file__), "..", "..", "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("pay_stub.html")

    html_content = template.render(
        employer_name=employer_name,
        employer_line1=employer_line1,
        employer_line2=employer_line2,
        employee_name=stub.employee_name,
        employee_line1=employee_line1,
        employee_line2=employee_line2,
        period_beginning=fmt_date(run.pay_period_start),
        period_ending=fmt_date(run.pay_period_end),
        pay_date=fmt_date(run.pay_date),
        total_hours=num(total_hours),
        net_pay_display=money(stub.net_pay, symbol=True),
        memo=stub.memo,
        earnings=earnings,
        taxes=taxes,
        deductions=[],
        summary_total_pay_current=money(total_pay_current, symbol=True),
        summary_total_pay_ytd=money(ytd.ytd_gross if ytd else 0, symbol=True),
        summary_taxes_current=money(total_taxes_current, symbol=True),
        summary_taxes_ytd=money((ytd.ytd_social_security_employee + ytd.ytd_unemployment_employee + ytd.ytd_federal_tax + ytd.ytd_provincial_or_state_tax) if ytd else 0, symbol=True),
        summary_deductions_current=money(deductions_current, symbol=True),
        summary_deductions_ytd=money(0, symbol=True),
    )

    # Render to PDF
    pdf_bytes = HTML(string=html_content).write_pdf()

    filename = f"paystub_{stub.employee_name.replace(' ', '_')}_{fmt_date(run.pay_date)}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
        }
    )



# ============================================================
# POST /paycheques/{stub_id}/email - Email pay stub with PDF attached
# ============================================================

class EmailPaychequeRequest(BaseModel):
    to_email: str
    subject: Optional[str] = None
    message: Optional[str] = None


@router.post("/paycheques/{stub_id}/email")
async def email_paycheque(
    stub_id: UUID,
    body: EmailPaychequeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Email the pay stub as a PDF attachment via SendGrid."""
    import sendgrid
    from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
    from app.core.config import settings
    import base64

    # Validate email present
    if not body.to_email or "@" not in body.to_email:
        raise HTTPException(status_code=400, detail="Valid email address required")

    # Fetch paycheque + run + employee to get names for filename/subject
    result = await db.execute(
        select(PayStub, PayRun)
        .join(PayRun, PayStub.pay_run_id == PayRun.id)
        .where(
            PayStub.id == stub_id,
            PayRun.owner_id == current_user.id,
        )
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Paycheque not found")
    stub, run = row

    # Get PDF bytes by calling internal PDF generator inline
    # (Reuse the same rendering logic as the /pdf endpoint)
    from weasyprint import HTML
    from jinja2 import Environment, FileSystemLoader
    from app.models.models import CompanyProfile
    import os

    emp_res = await db.execute(select(Employee).where(Employee.id == stub.employee_id))
    emp = emp_res.scalar_one_or_none()

    company_res = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == current_user.id)
    )
    company = company_res.scalar_one_or_none()

    tax_year = run.pay_period_start.year
    ytd_res = await db.execute(
        select(YTDBalance).where(
            YTDBalance.employee_id == stub.employee_id,
            YTDBalance.tax_year == tax_year,
        )
    )
    ytd = ytd_res.scalar_one_or_none()

    def money(v, symbol=False):
        n = float(v or 0)
        s = f"{abs(n):,.2f}"
        sign = "-" if n < 0 else ""
        return f"{sign}${s}" if symbol else f"{sign}{s}"

    def num(v):
        return f"{float(v or 0):,.2f}"

    def fmt_date(d):
        return d.strftime("%d-%m-%Y") if d else ""

    employer_name = company.company_name if company else ""
    employer_line1 = company.address_street if company else ""
    parts = []
    if company:
        if company.address_city: parts.append(company.address_city)
        if company.province_state: parts.append(company.province_state)
        if company.address_postal_code: parts.append(company.address_postal_code)
    employer_line2 = " ".join(parts)

    address_parts = []
    if emp:
        if emp.address_line1: address_parts.append(emp.address_line1)
        cpp = []
        if emp.city: cpp.append(emp.city)
        if emp.province_or_state: cpp.append(emp.province_or_state)
        if emp.postal_or_zip: cpp.append(emp.postal_or_zip)
        if cpp: address_parts.append(", ".join(cpp))
    employee_line1 = address_parts[0] if address_parts else ""
    employee_line2 = address_parts[1] if len(address_parts) > 1 else ""

    earnings = []
    total_hours = 0
    if stub.hours_regular and float(stub.hours_regular) > 0:
        rate = float(stub.hourly_rate or 0)
        earnings.append({"type":"Regular Pay","hours":num(stub.hours_regular),"rate":num(stub.hourly_rate),"current":money(float(stub.hours_regular) * rate),"ytd":money(ytd.ytd_gross if ytd else 0)})
        total_hours += float(stub.hours_regular)
    if stub.hours_overtime and float(stub.hours_overtime) > 0:
        rate = float(stub.hourly_rate or 0) * 1.5
        earnings.append({"type":"Overtime Pay","hours":num(stub.hours_overtime),"rate":num(rate),"current":money(float(stub.hours_overtime) * rate),"ytd":money(0)})
        total_hours += float(stub.hours_overtime)
    if stub.hours_stat_holiday and float(stub.hours_stat_holiday) > 0:
        rate = float(stub.hourly_rate or 0)
        earnings.append({"type":"Stat Holiday Pay","hours":num(stub.hours_stat_holiday),"rate":num(stub.hourly_rate),"current":money(float(stub.hours_stat_holiday) * rate),"ytd":money(0)})
        total_hours += float(stub.hours_stat_holiday)

    taxes = [
        {"type":"Canada Pension Plan","current":money(stub.social_security_employee),"ytd":money(ytd.ytd_social_security_employee if ytd else 0)},
        {"type":"Employment Insurance","current":money(stub.unemployment_employee),"ytd":money(ytd.ytd_unemployment_employee if ytd else 0)},
        {"type":"Income Tax","current":money(stub.federal_tax + stub.provincial_or_state_tax),"ytd":money((ytd.ytd_federal_tax + ytd.ytd_provincial_or_state_tax) if ytd else 0)},
        {"type":"Second Canada Pension Plan","current":money(stub.social_security_2_employee),"ytd":money(0)},
    ]

    total_pay_current = float(stub.gross_pay or 0)
    total_taxes_current = float(stub.total_employee_deductions or 0)

    template_dir = os.path.join(os.path.dirname(__file__), "..", "..", "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("pay_stub.html")
    html_content = template.render(
        employer_name=employer_name, employer_line1=employer_line1, employer_line2=employer_line2,
        employee_name=stub.employee_name, employee_line1=employee_line1, employee_line2=employee_line2,
        period_beginning=fmt_date(run.pay_period_start), period_ending=fmt_date(run.pay_period_end),
        pay_date=fmt_date(run.pay_date), total_hours=num(total_hours),
        net_pay_display=money(stub.net_pay, symbol=True), memo=stub.memo,
        earnings=earnings, taxes=taxes, deductions=[],
        summary_total_pay_current=money(total_pay_current, symbol=True),
        summary_total_pay_ytd=money(ytd.ytd_gross if ytd else 0, symbol=True),
        summary_taxes_current=money(total_taxes_current, symbol=True),
        summary_taxes_ytd=money((ytd.ytd_social_security_employee + ytd.ytd_unemployment_employee + ytd.ytd_federal_tax + ytd.ytd_provincial_or_state_tax) if ytd else 0, symbol=True),
        summary_deductions_current=money(0, symbol=True), summary_deductions_ytd=money(0, symbol=True),
    )
    pdf_bytes = HTML(string=html_content).write_pdf()

    # Build subject and message defaults if not provided
    period_display = f"{run.pay_period_start.strftime('%d %b %Y')} - {run.pay_period_end.strftime('%d %b %Y')}"
    subject = body.subject or f"Your pay stub for {period_display}"
    message = body.message or f"Hi {stub.employee_name.split()[0]},\n\nYour pay stub for the pay period {period_display} is attached.\n\nIf you have any questions, please reach out.\n\nThanks,\n{employer_name or current_user.email}"

    # Build filename
    safe_name = stub.employee_name.replace(" ", "_")
    filename = f"paystub_{safe_name}_{fmt_date(run.pay_date)}.pdf"

    # SendGrid mail
    mail = Mail(
        from_email=(settings.sendgrid_from_email, settings.sendgrid_from_name),
        to_emails=body.to_email,
        subject=subject,
        plain_text_content=message,
    )
    encoded = base64.b64encode(pdf_bytes).decode()
    attachment = Attachment(
        FileContent(encoded),
        FileName(filename),
        FileType("application/pdf"),
        Disposition("attachment"),
    )
    mail.attachment = attachment

    try:
        sg = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)
        response = sg.send(mail)
        if response.status_code >= 300:
            raise HTTPException(status_code=502, detail=f"SendGrid returned {response.status_code}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to send email: {str(e)}")

    return {"sent": True, "to": body.to_email}

# ============================================================
# POST /paycheques/{stub_id}/void
# ============================================================

class VoidPaychequeRequest(BaseModel):
    reason: str


@router.post("/paycheques/{stub_id}/void")
async def void_paycheque(
    stub_id: UUID,
    body: VoidPaychequeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Void a single paycheque (pay stub).

    Requirements per V1 spec:
    - Reason required (non-empty after strip)
    - Only stubs from finalized runs can be voided
    - Can't void an already-voided stub
    - Reverses YTD balances for the employee (subtracts stub's amounts)
    - Marks the stub as voided (does NOT touch other stubs in the run)
    - Writes audit log with reason
    """
    reason = (body.reason or "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Reason is required to void a paycheque")

    # Load stub + run to verify ownership
    result = await db.execute(
        select(PayStub, PayRun)
        .join(PayRun, PayStub.pay_run_id == PayRun.id)
        .where(
            PayStub.id == stub_id,
            PayRun.owner_id == current_user.id,
        )
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Paycheque not found")
    stub, run = row

    if stub.voided:
        raise HTTPException(status_code=400, detail="This paycheque is already voided")

    if run.status != "finalized":
        raise HTTPException(
            status_code=400,
            detail=f"Only paycheques from finalized runs can be voided (current: {run.status})"
        )

    # Reverse YTD balances for this employee (this year, this jurisdiction)
    snap = stub.calculation_snapshot or {}
    country = snap.get("country", run.country)
    subnational = snap.get("subnational")
    jurisdiction_key = _jurisdiction_key(country, subnational)
    tax_year = run.pay_period_start.year

    ytd_result = await db.execute(
        select(YTDBalance).where(
            YTDBalance.employee_id == stub.employee_id,
            YTDBalance.tax_year == tax_year,
            YTDBalance.jurisdiction == jurisdiction_key,
        )
    )
    ytd = ytd_result.scalar_one_or_none()
    if ytd is not None:
        # Subtract this stub's amounts from YTD
        ytd.ytd_gross = (ytd.ytd_gross or Decimal(0)) - (stub.gross_pay or Decimal(0))
        ytd.ytd_federal_tax = (ytd.ytd_federal_tax or Decimal(0)) - (stub.federal_tax or Decimal(0))
        ytd.ytd_provincial_or_state_tax = (ytd.ytd_provincial_or_state_tax or Decimal(0)) - (stub.provincial_or_state_tax or Decimal(0))
        ytd.ytd_social_security_employee = (ytd.ytd_social_security_employee or Decimal(0)) - (stub.social_security_employee or Decimal(0))
        ytd.ytd_social_security_employer = (ytd.ytd_social_security_employer or Decimal(0)) - (stub.social_security_employer or Decimal(0))
        ytd.ytd_unemployment_employee = (ytd.ytd_unemployment_employee or Decimal(0)) - (stub.unemployment_employee or Decimal(0))
        ytd.ytd_unemployment_employer = (ytd.ytd_unemployment_employer or Decimal(0)) - (stub.unemployment_employer or Decimal(0))

    # Mark the stub voided
    stub.voided = True
    stub.voided_at = datetime.now(timezone.utc)
    stub.voided_reason = reason[:1000]

    # Audit log
    audit = PayrollAuditLog(
        owner_id=current_user.id,
        entity_type="pay_stub",
        entity_id=stub.id,
        action="voided",
        actor_user_id=current_user.id,
        actor_role="admin",
        before_state={"voided": False},
        after_state={
            "voided": True,
            "reason": reason,
            "gross_pay_reversed": str(stub.gross_pay),
            "net_pay_reversed": str(stub.net_pay),
        },
        notes=f"Paycheque voided: {reason[:200]}",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(stub)

    return {
        "id": str(stub.id),
        "voided": stub.voided,
        "voided_at": stub.voided_at.isoformat() if stub.voided_at else None,
        "voided_reason": stub.voided_reason,
        "status": "voided",
    }

# ============================================================
# POST /runs/{id}/void
# ============================================================

@router.post("/runs/{run_id}/void", response_model=PayRunResponse)
async def void_pay_run(
    run_id: UUID,
    body: VoidRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Void a pay run. If finalized, reverses YTD updates."""
    run_result = await db.execute(
        select(PayRun).where(
            PayRun.id == run_id, PayRun.owner_id == current_user.id
        )
    )
    run = run_result.scalar_one_or_none()
    if not run:
        raise HTTPException(404, "Pay run not found")
    if run.status == "voided":
        raise HTTPException(400, "Pay run is already voided")

    was_finalized = run.status == "finalized"

    if was_finalized:
        # Reverse YTD updates
        stubs_result = await db.execute(
            select(PayStub).where(PayStub.pay_run_id == run_id)
        )
        stubs = stubs_result.scalars().all()

        tax_year = run.pay_period_start.year
        for stub in stubs:
            snap = stub.calculation_snapshot or {}
            country = snap.get("country", run.country)
            subnational = snap.get("subnational")
            jurisdiction_key = _jurisdiction_key(country, subnational)

            ytd_result = await db.execute(
                select(YTDBalance).where(
                    YTDBalance.employee_id == stub.employee_id,
                    YTDBalance.tax_year == tax_year,
                    YTDBalance.jurisdiction == jurisdiction_key,
                )
            )
            ytd = ytd_result.scalar_one_or_none()
            if ytd:
                _reverse_ytd_delta(ytd, stub)

    # Mark voided
    prior_status = run.status
    run.status = "voided"
    run.voided_at = datetime.now(timezone.utc)
    run.void_reason = body.reason

    # Audit
    audit = PayrollAuditLog(
        owner_id=current_user.id,
        entity_type="pay_run",
        entity_id=run.id,
        action="voided",
        actor_user_id=current_user.id,
        actor_role="admin",
        before_state={"status": prior_status},
        after_state={"status": "voided", "reason": body.reason},
        notes=f"Voided pay run (prior status: {prior_status})",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(run)
    return _run_to_response(run)

