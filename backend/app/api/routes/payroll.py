from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, List
from decimal import Decimal
import uuid
from uuid import UUID
import secrets
import os
import traceback

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import (Employee, PayrollSettings, PayRun, PayStub, PaySchedule, PayType, EmployeePayItem)
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/payroll", tags=["Payroll"])

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    HAS_SENDGRID = True
except ImportError:
    HAS_SENDGRID = False


# ============================================================================
# Pydantic schemas
# ============================================================================

class EmployeeCreateBody(BaseModel):
    first_name: str
    last_name: str
    personal_email: EmailStr
    position_title: Optional[str] = None
    employment_type: str = "full_time"
    start_date: Optional[date] = None
    pay_type: str = "salary"
    salary_amount: Optional[float] = None
    hourly_rate: Optional[float] = None
    hours_per_week: Optional[float] = None
    pay_schedule: str = "bi_weekly"
    currency: str = "CAD"
    department: Optional[str] = None
    employee_number: Optional[str] = None
    notes: Optional[str] = None
    work_location_id: Optional[UUID] = None


class EmployeeUpdateBody(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    preferred_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    sin_or_ssn: Optional[str] = None
    personal_email: Optional[str] = None
    phone: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    province_or_state: Optional[str] = None
    postal_or_zip: Optional[str] = None
    country: Optional[str] = None
    employee_number: Optional[str] = None
    position_title: Optional[str] = None
    department: Optional[str] = None
    work_location_id: Optional[str] = None
    work_city: Optional[str] = None
    employment_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    manager_name: Optional[str] = None
    pay_type: Optional[str] = None
    salary_amount: Optional[float] = None
    hourly_rate: Optional[float] = None
    hours_per_week: Optional[float] = None
    hours_per_day: Optional[float] = None
    days_per_week: Optional[float] = None
    pay_frequency: Optional[str] = None
    pay_schedule: Optional[str] = None
    currency: Optional[str] = None
    bank_name: Optional[str] = None
    transit_number: Optional[str] = None
    institution_number: Optional[str] = None
    routing_number: Optional[str] = None
    account_number_encrypted: Optional[str] = None
    account_type: Optional[str] = None
    tax_info: Optional[Dict[str, Any]] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_email: Optional[str] = None
    notes: Optional[str] = None
    work_location_id: Optional[UUID] = None
    dental_benefit_code: Optional[str] = None


class EmployeeSelfCompleteBody(BaseModel):
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    sin_or_ssn: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    province_or_state: Optional[str] = None
    postal_or_zip: Optional[str] = None
    country: Optional[str] = None
    bank_name: Optional[str] = None
    transit_number: Optional[str] = None
    institution_number: Optional[str] = None
    routing_number: Optional[str] = None
    account_number_encrypted: Optional[str] = None
    account_type: Optional[str] = None
    tax_info: Optional[Dict[str, Any]] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_email: Optional[str] = None


class PayrollSettingsBody(BaseModel):
    country: Optional[str] = None
    province_or_state: Optional[str] = None
    default_pay_schedule: Optional[str] = None
    pay_period_anchor_date: Optional[date] = None
    pay_schedule_config: Optional[Dict[str, Any]] = None
    currency: Optional[str] = None
    custom_deduction_rates: Optional[Dict[str, Any]] = None
    company_bank_name: Optional[str] = None
    company_transit_number: Optional[str] = None
    company_institution_number: Optional[str] = None
    company_routing_number: Optional[str] = None
    company_account_number_encrypted: Optional[str] = None
    business_number: Optional[str] = None
    ein: Optional[str] = None
    payroll_active: Optional[bool] = None
    bank_details: Optional[Dict[str, Any]] = None
    stat_holiday_option: Optional[int] = None


# ============================================================================
# Serializers
# ============================================================================

def serialize_employee(e):
    return {
        "id": str(e.id),
        "owner_id": str(e.owner_id),
        "user_id": str(e.user_id) if e.user_id else None,
        "first_name": e.first_name, "last_name": e.last_name, "preferred_name": e.preferred_name,
        "date_of_birth": e.date_of_birth.isoformat() if e.date_of_birth else None,
        "gender": e.gender, "marital_status": e.marital_status, "sin_or_ssn": e.sin_or_ssn,
        "phone": e.phone, "personal_email": e.personal_email,
        "address_line1": e.address_line1, "address_line2": e.address_line2,
        "city": e.city, "province_or_state": e.province_or_state,
        "postal_or_zip": e.postal_or_zip, "country": e.country,
        "employee_number": e.employee_number, "position_title": e.position_title,
        "department": e.department,
        "work_location_id": str(e.work_location_id) if e.work_location_id else None, "work_city": e.work_city, "employment_type": e.employment_type,
        "start_date": e.start_date.isoformat() if e.start_date else None,
        "end_date": e.end_date.isoformat() if e.end_date else None,
        "status": e.status, "manager_name": e.manager_name,
        "pay_type": e.pay_type,
        "salary_amount": float(e.salary_amount) if e.salary_amount is not None else None,
        "hourly_rate": float(e.hourly_rate) if e.hourly_rate is not None else None,
        "hours_per_week": float(e.hours_per_week) if e.hours_per_week is not None else None,
        "pay_schedule": e.pay_schedule, "currency": e.currency,
        "bank_name": e.bank_name, "transit_number": e.transit_number,
        "institution_number": e.institution_number, "routing_number": e.routing_number,
        "account_number_encrypted": e.account_number_encrypted, "account_type": e.account_type,
        "tax_info": e.tax_info or {},
        "emergency_contact_name": e.emergency_contact_name,
        "emergency_contact_relationship": e.emergency_contact_relationship,
        "emergency_contact_phone": e.emergency_contact_phone,
        "emergency_contact_email": e.emergency_contact_email,
        "invite_status": e.invite_status,
        "invite_sent_at": e.invite_sent_at.isoformat() if e.invite_sent_at else None,
        "invite_accepted_at": e.invite_accepted_at.isoformat() if e.invite_accepted_at else None,
        "profile_completed": e.profile_completed, "notes": e.notes,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "updated_at": e.updated_at.isoformat() if e.updated_at else None,
    }


def serialize_settings(s):
    return {
        "id": str(s.id), "owner_id": str(s.owner_id),
        "country": s.country, "province_or_state": s.province_or_state,
        "default_pay_schedule": s.default_pay_schedule,
        "pay_period_anchor_date": s.pay_period_anchor_date.isoformat() if s.pay_period_anchor_date else None,
        "pay_schedule_config": s.pay_schedule_config or {},
        "currency": s.currency,
        "custom_deduction_rates": s.custom_deduction_rates or {},
        "company_bank_name": s.company_bank_name,
        "company_transit_number": s.company_transit_number,
        "company_institution_number": s.company_institution_number,
        "company_routing_number": s.company_routing_number,
        "company_account_number_encrypted": s.company_account_number_encrypted,
        "business_number": s.business_number, "ein": s.ein,
        "payroll_active": s.payroll_active,
        "bank_details": s.bank_details or {},
        "stat_holiday_option": s.stat_holiday_option if s.stat_holiday_option is not None else 1,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


# ============================================================================
# Employee CRUD
# ============================================================================

@router.get("/employees")
async def list_employees(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Employee).where(Employee.owner_id == current_user.id).order_by(Employee.created_at.desc())
    )
    return [serialize_employee(e) for e in result.scalars().all()]


@router.post("/employees", status_code=201)
async def create_employee(body: EmployeeCreateBody, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    email = body.personal_email.lower().strip()
    existing = await db.execute(
        select(Employee).where(Employee.owner_id == current_user.id, Employee.personal_email == email)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(409, "An employee with this email already exists")

    emp = Employee(
        owner_id=current_user.id,
        first_name=body.first_name.strip(), last_name=body.last_name.strip(),
        personal_email=email, position_title=body.position_title,
        employment_type=body.employment_type, start_date=body.start_date,
        pay_type=body.pay_type,
        salary_amount=Decimal(str(body.salary_amount)) if body.salary_amount is not None else None,
        hourly_rate=Decimal(str(body.hourly_rate)) if body.hourly_rate is not None else None,
        hours_per_week=Decimal(str(body.hours_per_week)) if body.hours_per_week is not None else None,
        pay_schedule=body.pay_schedule, currency=body.currency,
        department=body.department, employee_number=body.employee_number,
        notes=body.notes, status="active",
    )
    db.add(emp)
    await db.commit()
    await db.refresh(emp)

    # auto-assign required PayTypes as EmployeePayItem rows.
    # Stat holiday pay, ADW, and any future required-by-law pay types are
    # attached to every new employee for this owner. Idempotent by design.
    required = await db.execute(
        select(PayType).where(
            PayType.owner_id == current_user.id,
            PayType.is_required_by_law == True,
            PayType.is_active == True,
        )
    )
    for pt in required.scalars().all():
        db.add(EmployeePayItem(
            employee_id=emp.id,
            pay_type_id=pt.id,
            owner_id=current_user.id,
            is_active=True,
        ))
    await db.commit()

    return serialize_employee(emp)


@router.get("/employees/{employee_id}")
async def get_employee(employee_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        emp_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(400, "Invalid employee ID")
    result = await db.execute(
        select(Employee).where(Employee.id == emp_uuid, Employee.owner_id == current_user.id)
    )
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(404, "Employee not found")
    return serialize_employee(emp)


@router.patch("/employees/{employee_id}")
async def update_employee(employee_id: str, body: EmployeeUpdateBody, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        emp_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(400, "Invalid employee ID")
    result = await db.execute(
        select(Employee).where(Employee.id == emp_uuid, Employee.owner_id == current_user.id)
    )
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(404, "Employee not found")

    data = body.dict(exclude_unset=True)
    for key, value in data.items():
        if key in ("salary_amount", "hourly_rate", "hours_per_week") and value is not None:
            value = Decimal(str(value))
        if key == "personal_email" and value:
            value = value.lower().strip()
        setattr(emp, key, value)
    await db.commit()
    await db.refresh(emp)
    return serialize_employee(emp)


@router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        emp_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(400, "Invalid employee ID")
    result = await db.execute(
        select(Employee).where(Employee.id == emp_uuid, Employee.owner_id == current_user.id)
    )
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(404, "Employee not found")
    emp.status = "terminated"
    if not emp.end_date:
        emp.end_date = date.today()
    await db.commit()
    return {"success": True, "id": str(emp.id), "status": "terminated"}


# ============================================================================
# Self-service invite flow
# ============================================================================

@router.post("/employees/{employee_id}/send-invite")
async def send_employee_invite(employee_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        emp_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(400, "Invalid employee ID")
    result = await db.execute(
        select(Employee).where(Employee.id == emp_uuid, Employee.owner_id == current_user.id)
    )
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(404, "Employee not found")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)
    emp.invite_token = token
    emp.invite_status = "pending"
    emp.invite_expires_at = expires_at
    emp.invite_sent_at = datetime.utcnow()
    emp.invite_accepted_at = None
    await db.commit()

    invite_url = f"https://app.getnovala.com/employee/onboard/{token}"

    sent_via_email = False
    email_error = None
    if HAS_SENDGRID:
        api_key = os.getenv("SENDGRID_API_KEY")
        from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@getnovala.com")
        if api_key:
            try:
                owner_name = getattr(current_user, "full_name", None) or current_user.email
                body_html = f"""<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#1f2937;">
  <div style="text-align:center;margin-bottom:32px;"><h1 style="color:#0F5959;font-size:28px;margin:0;">Welcome to Novala</h1></div>
  <p style="font-size:16px;line-height:1.5;">Hi {emp.first_name},</p>
  <p style="font-size:16px;line-height:1.5;">{owner_name} has added you as an employee. To set up your direct deposit and tax information, please complete your profile using the secure link below.</p>
  <div style="text-align:center;margin:32px 0;"><a href="{invite_url}" style="display:inline-block;background:#0F5959;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Complete Your Profile</a></div>
  <p style="font-size:14px;color:#6b7280;line-height:1.5;">This link expires in 7 days. If you weren't expecting this email, you can safely ignore it.</p>
  <p style="font-size:14px;color:#6b7280;margin-top:32px;">— The Novala Team</p>
</body></html>"""
                message = Mail(from_email=from_email, to_emails=emp.personal_email,
                               subject="Complete your employment profile", html_content=body_html)
                SendGridAPIClient(api_key).send(message)
                sent_via_email = True
            except Exception as e:
                email_error = str(e)
                traceback.print_exc()

    return {"success": True, "invite_url": invite_url,
            "expires_at": expires_at.isoformat(),
            "email_sent": sent_via_email, "email_error": email_error}


@router.get("/employees/by-invite/{token}")
async def get_employee_by_invite(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.invite_token == token))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(404, "Invalid invite link")
    if emp.invite_status == "accepted":
        raise HTTPException(410, "This invite has already been used")
    if emp.invite_expires_at and emp.invite_expires_at < datetime.utcnow():
        raise HTTPException(410, "This invite link has expired")
    return {
        "first_name": emp.first_name, "last_name": emp.last_name,
        "personal_email": emp.personal_email, "position_title": emp.position_title,
        "start_date": emp.start_date.isoformat() if emp.start_date else None,
        "employment_type": emp.employment_type,
        "currency": emp.currency, "country": emp.country,
        "invite_status": emp.invite_status,
        "invite_expires_at": emp.invite_expires_at.isoformat() if emp.invite_expires_at else None,
    }


@router.post("/employees/by-invite/{token}/complete")
async def complete_employee_profile(token: str, body: EmployeeSelfCompleteBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.invite_token == token))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(404, "Invalid invite link")
    if emp.invite_status == "accepted":
        raise HTTPException(410, "This invite has already been used")
    if emp.invite_expires_at and emp.invite_expires_at < datetime.utcnow():
        raise HTTPException(410, "This invite link has expired")
    data = body.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(emp, key, value)
    emp.profile_completed = True
    emp.invite_status = "accepted"
    emp.invite_accepted_at = datetime.utcnow()
    await db.commit()
    return {"success": True, "message": "Profile completed successfully"}


# ============================================================================
# Payroll settings
# ============================================================================

@router.get("/settings")
async def get_payroll_settings(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PayrollSettings).where(PayrollSettings.owner_id == current_user.id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        return {
            "exists": False, "owner_id": str(current_user.id),
            "country": "CA", "province_or_state": None,
            "default_pay_schedule": "bi_weekly", "pay_period_anchor_date": None,
            "currency": "CAD", "custom_deduction_rates": {},
            "company_bank_name": None, "company_transit_number": None,
            "company_institution_number": None, "company_routing_number": None,
            "business_number": None, "ein": None, "payroll_active": False,
            "stat_holiday_option": 1,
        }
    return {**serialize_settings(settings), "exists": True}


@router.post("/settings")
async def upsert_payroll_settings(body: PayrollSettingsBody, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PayrollSettings).where(PayrollSettings.owner_id == current_user.id)
    )
    settings = result.scalar_one_or_none()
    data = body.dict(exclude_unset=True)
    if settings:
        for key, value in data.items():
            setattr(settings, key, value)
    else:
        data.setdefault("country", "CA")
        data.setdefault("default_pay_schedule", "bi_weekly")
        data.setdefault("currency", "CAD")
        settings = PayrollSettings(owner_id=current_user.id, **data)
        db.add(settings)
    await db.commit()
    await db.refresh(settings)
    return serialize_settings(settings)



# ============================================================================
# Pay Run - Change Period
# ============================================================================
class PayRunPeriodBody(BaseModel):
    pay_period_start: date
    pay_period_end: date
    pay_date: date


@router.patch("/pay-runs/{run_id}/period")
async def update_pay_run_period(
    run_id: str,
    body: PayRunPeriodBody,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Override the auto-filled pay period start, end, and pay date."""
    result = await db.execute(
        select(PayRun).where(PayRun.id == run_id, PayRun.owner_id == current_user.id)
    )
    run = result.scalar_one_or_none()
    if not run:
        return {"error": "Pay run not found"}, 404

    if body.pay_period_end < body.pay_period_start:
        return {"error": "End date must be on or after start date"}, 400

    run.pay_period_start = body.pay_period_start
    run.pay_period_end = body.pay_period_end
    run.pay_date = body.pay_date
    await db.commit()
    await db.refresh(run)

    return {
        "id": str(run.id),
        "pay_period_start": run.pay_period_start.isoformat(),
        "pay_period_end": run.pay_period_end.isoformat(),
        "pay_date": run.pay_date.isoformat(),
    }


# ============================================================================
# Stat Holiday Preview (Phase 2)
# ============================================================================
from datetime import date as _date, timedelta as _td

# Alberta ESA general holidays. Heritage Day (first Mon in Aug) is OPTIONAL and excluded.
# For 2026 fixed-date holidays are listed; Easter and Victoria Day computed.
_AB_FIXED_HOLIDAYS_2026 = [
    (_date(2026, 1, 1), "New Year's Day"),
    (_date(2026, 2, 16), "Alberta Family Day"),
    (_date(2026, 4, 3), "Good Friday"),
    (_date(2026, 5, 18), "Victoria Day"),
    (_date(2026, 7, 1), "Canada Day"),
    (_date(2026, 9, 7), "Labour Day"),
    (_date(2026, 10, 12), "Thanksgiving Day"),
    (_date(2026, 11, 11), "Remembrance Day"),
    (_date(2026, 12, 25), "Christmas Day"),
]

_AB_FIXED_HOLIDAYS_2027 = [
    (_date(2027, 1, 1), "New Year's Day"),
    (_date(2027, 2, 15), "Alberta Family Day"),
    (_date(2027, 3, 26), "Good Friday"),
    (_date(2027, 5, 24), "Victoria Day"),
    (_date(2027, 7, 1), "Canada Day"),
    (_date(2027, 9, 6), "Labour Day"),
    (_date(2027, 10, 11), "Thanksgiving Day"),
    (_date(2027, 11, 11), "Remembrance Day"),
    (_date(2027, 12, 27), "Christmas Day (observed)"),
]

def _get_ab_holidays_in_range(start: _date, end: _date):
    """Return list of (date, name) tuples for Alberta stat holidays within [start, end]."""
    all_holidays = _AB_FIXED_HOLIDAYS_2026 + _AB_FIXED_HOLIDAYS_2027
    return [(d, name) for d, name in all_holidays if start <= d <= end]


class StatHolidayPreviewBody(BaseModel):
    period_start: date
    period_end: date
    subnational: Optional[str] = "AB"


@router.post("/stat-holidays/preview")
async def preview_stat_holidays(
    body: StatHolidayPreviewBody,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return stat holidays in the pay period + per-employee eligibility."""

    # 1. Only Alberta supported today
    if (body.subnational or "AB").upper() != "AB":
        return {"holidays": [], "stat_holiday_method": 1, "total_stat_pay": 0}

    holidays = _get_ab_holidays_in_range(body.period_start, body.period_end)
    if not holidays:
        return {"holidays": [], "stat_holiday_method": 1, "total_stat_pay": 0}

    # 2. Load settings (get chosen method)
    settings_row = await db.execute(
        select(PayrollSettings).where(PayrollSettings.owner_id == current_user.id)
    )
    settings = settings_row.scalar_one_or_none()
    method = getattr(settings, "stat_holiday_option", 1) if settings else 1

    # 3. Load active employees
    emp_res = await db.execute(
        select(Employee).where(
            Employee.owner_id == current_user.id,
            Employee.status == "active",
        )
    )
    employees = emp_res.scalars().all()

    holiday_blocks = []
    total_stat_pay = 0.0

    for h_date, h_name in holidays:
        emp_results = []
        for e in employees:
            # ---- Employed >= 30 days check ----
            start = e.start_date
            if not start:
                emp_results.append({
                    "employee_id": str(e.id),
                    "first_name": e.first_name,
                    "last_name": e.last_name,
                    "position_title": e.position_title,
                    "eligible": False,
                    "checks": {
                        "employed_30_days": {"pass": False, "days_employed": None},
                    },
                    "adw": 0,
                    "stat_pay_amount": 0,
                    "ineligibility_reason": "No start date on file",
                    "method_applied": method,
                    "hourly_rate": float(e.hourly_rate) if e.hourly_rate else 0,
                })
                continue

            days_employed = (h_date - start).days
            passed_30 = days_employed >= 30
            if not passed_30:
                emp_results.append({
                    "employee_id": str(e.id),
                    "first_name": e.first_name,
                    "last_name": e.last_name,
                    "position_title": e.position_title,
                    "eligible": False,
                    "checks": {
                        "employed_30_days": {"pass": False, "days_employed": days_employed},
                    },
                    "adw": 0,
                    "stat_pay_amount": 0,
                    "ineligibility_reason": f"Employed {days_employed} days (Alberta ESA requires 30)",
                    "method_applied": method,
                    "hourly_rate": float(e.hourly_rate) if e.hourly_rate else 0,
                })
                continue

            # ---- ADW: last 4 weeks of finalized stubs ----
            # Fallback if not enough data: hourly_rate * hours_per_day
            adw = None
            try:
                four_weeks_ago = h_date - _td(days=28)
                stub_res = await db.execute(
                    select(PayStub).where(
                        PayStub.employee_id == e.id,
                        PayStub.pay_period_end >= four_weeks_ago,
                        PayStub.pay_period_end < h_date,
                        PayStub.finalized_at.isnot(None),
                    )
                )
                stubs = stub_res.scalars().all()
                total_gross = 0.0
                total_days = 0.0
                for s in stubs:
                    if s.gross_pay:
                        total_gross += float(s.gross_pay)
                    hrs = 0
                    try:
                        if s.regular_hours:
                            hrs += float(s.regular_hours)
                    except Exception:
                        pass
                    # Rough days estimate: hours / 8 per day
                    if hrs > 0:
                        total_days += hrs / 8.0
                if total_days > 0:
                    adw = round(total_gross / total_days, 2)
            except Exception:
                adw = None

            if adw is None:
                # Fallback: hourly_rate * hours_per_day
                hr = float(e.hourly_rate) if e.hourly_rate else 0
                hpd = float(e.hours_per_day) if e.hours_per_day else 8
                adw = round(hr * hpd, 2) if hr > 0 else 0

            # For MVP the 5-of-9 and day-before/day-after checks are assumed pass
            # (no Workforce clock data yet). Employer can override in the popup.
            checks = {
                "employed_30_days": {"pass": True, "days_employed": days_employed},
                "worked_5_of_9": {"pass": True, "assumed": True},
                "worked_before_after": {"pass": True, "assumed": True},
            }

            # Hours worked on the holiday itself. Zero unless explicitly logged.
            hours_worked_on_holiday = 0.0

            # Compute stat pay per method
            if method == 1:
                # Time and a half for hours worked + ADW
                rate = float(e.hourly_rate) if e.hourly_rate else 0
                stat_pay = round(adw + (1.5 * rate * hours_worked_on_holiday), 2)
            else:
                # Regular pay (ADW) + substitute day off later
                stat_pay = adw

            emp_results.append({
                "employee_id": str(e.id),
                "first_name": e.first_name,
                "last_name": e.last_name,
                "position_title": e.position_title,
                "eligible": True,
                "checks": checks,
                "adw": adw,
                "hours_worked_on_holiday": hours_worked_on_holiday,
                "stat_pay_amount": stat_pay,
                "method_applied": method,
                "hourly_rate": float(e.hourly_rate) if e.hourly_rate else 0,
            })
            total_stat_pay += stat_pay

        holiday_blocks.append({
            "name": h_name,
            "date": h_date.isoformat(),
            "employees": emp_results,
        })

    return {
        "holidays": holiday_blocks,
        "stat_holiday_method": method,
        "total_stat_pay": round(total_stat_pay, 2),
    }


# ============================================================================
# Pay Runs
# ============================================================================

class PayStubInput(BaseModel):
    employee_id: str
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    position_title: Optional[str] = None
    pay_type: Optional[str] = None
    hours_worked: Optional[float] = None
    hourly_rate: Optional[float] = None
    gross: float
    deductions: Dict[str, Any] = {}
    deductions_total: float
    net: float
    currency: str = "CAD"


class PayRunCreateBody(BaseModel):
    pay_period_start: date
    pay_period_end: date
    pay_date: date
    country: str = "CA"
    currency: str = "CAD"
    notes: Optional[str] = None
    pay_stubs: List[PayStubInput]


def serialize_pay_run(pr, stubs=None):
    out = {
        "id": str(pr.id),
        "owner_id": str(pr.owner_id),
        "pay_period_start": pr.pay_period_start.isoformat() if pr.pay_period_start else None,
        "pay_period_end": pr.pay_period_end.isoformat() if pr.pay_period_end else None,
        "pay_date": pr.pay_date.isoformat() if pr.pay_date else None,
        "status": pr.status,
        "country": pr.country,
        "currency": pr.currency,
        "total_gross": float(pr.total_gross or 0),
        "total_deductions": float(pr.total_deductions or 0),
        "total_net": float(pr.total_net or 0),
        "employee_count": pr.employee_count or 0,
        "notes": pr.notes,
        "created_at": pr.created_at.isoformat() if pr.created_at else None,
        "approved_at": pr.approved_at.isoformat() if pr.approved_at else None,
    }
    if stubs is not None:
        out["pay_stubs"] = [serialize_pay_stub(s) for s in stubs]
    return out


def serialize_pay_stub(s):
    # Pull the draft-only transient state (memo, skipped) out of calculation_snapshot
    snap = s.calculation_snapshot or {}
    return {
        "id": str(s.id),
        "pay_run_id": str(s.pay_run_id),
        "employee_id": str(s.employee_id),
        "employee_name": s.employee_name,
        "employee_email": s.employee_email,
        "position_title": s.position_title,
        "pay_type": s.pay_type,
        "hours_regular": float(s.hours_regular or 0),
        "hours_overtime": float(s.hours_overtime or 0),
        "hours_stat_holiday": float(s.hours_stat_holiday or 0),
        "hours_vacation": float(s.hours_vacation or 0),
        "hours_sick": float(s.hours_sick or 0),
        "hourly_rate": float(s.hourly_rate) if s.hourly_rate is not None else None,
        "salary_amount": float(s.salary_amount or 0),
        "bonus": float(s.bonus or 0),
        "commission": float(s.commission or 0),
        "gross_pay": float(s.gross_pay or 0),
        "total_employee_deductions": float(s.total_employee_deductions or 0),
        "net_pay": float(s.net_pay or 0),
        "memo": snap.get("memo", ""),
        "skipped": snap.get("skipped", False),
        "currency": s.currency,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@router.get("/pay-runs")
async def list_pay_runs(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PayRun).where(PayRun.owner_id == current_user.id).order_by(PayRun.pay_date.desc(), PayRun.created_at.desc())
    )
    return [serialize_pay_run(pr) for pr in result.scalars().all()]


@router.get("/pay-runs/{run_id}")
async def get_pay_run(run_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        rid = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(400, "Invalid pay run ID")

    result = await db.execute(select(PayRun).where(PayRun.id == rid, PayRun.owner_id == current_user.id))
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(404, "Pay run not found")

    stubs_result = await db.execute(select(PayStub).where(PayStub.pay_run_id == pr.id))
    stubs = stubs_result.scalars().all()
    return serialize_pay_run(pr, stubs)


@router.post("/pay-runs/draft")
async def get_or_create_draft(
    body: dict,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Find or create a draft pay run for the given period.
    Body: { pay_period_start, pay_period_end, pay_date }
    Returns the draft with all its pay stubs.
    """
    from datetime import datetime as _dt
    period_start = body.get("pay_period_start")
    period_end = body.get("pay_period_end")
    pay_date = body.get("pay_date")
    if not period_start or not period_end or not pay_date:
        raise HTTPException(400, "pay_period_start, pay_period_end, pay_date required")

    period_start_d = _dt.fromisoformat(period_start).date() if isinstance(period_start, str) else period_start
    period_end_d = _dt.fromisoformat(period_end).date() if isinstance(period_end, str) else period_end
    pay_date_d = _dt.fromisoformat(pay_date).date() if isinstance(pay_date, str) else pay_date

    # Look for existing draft for this exact period
    # Use the MOST RECENT draft if multiple exist (defensive — duplicates shouldn't happen but we won't crash if they do)
    result = await db.execute(
        select(PayRun).where(
            PayRun.owner_id == current_user.id,
            PayRun.pay_period_start == period_start_d,
            PayRun.pay_period_end == period_end_d,
            PayRun.status == "draft",
        ).order_by(PayRun.created_at.desc()).limit(1)
    )
    pr = result.scalars().first()

    if pr is None:
        # Create a new draft. Seed one PayStub per active employee.
        # Auto-attach default schedule for draft creation
        sched_res = await db.execute(
            select(PaySchedule).where(
                PaySchedule.owner_id == current_user.id,
                PaySchedule.is_paused.is_(False),
            ).order_by(PaySchedule.is_default.desc(), PaySchedule.created_at.asc())
        )
        default_sched = sched_res.scalars().first()

        _ps = period_start_d
        _pe = period_end_d
        _pd = pay_date_d
        if default_sched:
            from app.payroll.schedule_helpers import next_pay_date, compute_period_for_pay_date
            from datetime import date as _date_cls
            _pd = next_pay_date(default_sched, _date_cls.today())
            _ps, _pe = compute_period_for_pay_date(default_sched, _pd)

        pr = PayRun(
            owner_id=current_user.id,
            pay_period_start=_ps,
            pay_period_end=_pe,
            pay_date=_pd,
            pay_schedule_id=default_sched.id if default_sched else None,
            status="draft",
            country=body.get("country", "CA"),
            currency=body.get("currency", "CAD"),
        )
        db.add(pr)
        await db.flush()

        emps_res = await db.execute(
            select(Employee).where(
                Employee.owner_id == current_user.id,
                Employee.status == "active",
            )
        )
        for e in emps_res.scalars().all():
            stub = PayStub(
                pay_run_id=pr.id,
                employee_id=e.id,
                employee_name=((e.first_name or "") + " " + (e.last_name or "")).strip() or None,
                employee_email=e.personal_email,
                position_title=e.position_title,
                pay_type=e.pay_type,
                hourly_rate=e.hourly_rate,
                salary_amount=e.salary_amount or 0,
                currency=e.currency or "CAD",
            )
            db.add(stub)
        await db.commit()
        await db.refresh(pr)

    # Fetch stubs and return
    stubs_res = await db.execute(select(PayStub).where(PayStub.pay_run_id == pr.id))
    stubs = list(stubs_res.scalars().all())
    return serialize_pay_run(pr, stubs)


@router.patch("/pay-runs/{run_id}/lines/{employee_id}")
async def update_pay_run_line(
    run_id: str,
    employee_id: str,
    body: dict,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Auto-save a single pay stub line. Accepts a sparse dict of fields to update."""
    try:
        rid = uuid.UUID(run_id)
        eid = uuid.UUID(employee_id)
    except (ValueError, AttributeError):
        raise HTTPException(400, "Invalid run_id or employee_id")

    # Verify the run belongs to this user
    run_res = await db.execute(
        select(PayRun).where(PayRun.id == rid, PayRun.owner_id == current_user.id)
    )
    pr = run_res.scalar_one_or_none()
    if pr is None:
        raise HTTPException(404, "Pay run not found")
    if pr.status != "draft":
        raise HTTPException(409, "Cannot edit a non-draft pay run")

    # Find the stub
    stub_res = await db.execute(
        select(PayStub).where(PayStub.pay_run_id == rid, PayStub.employee_id == eid)
    )
    stub = stub_res.scalar_one_or_none()
    if stub is None:
        raise HTTPException(404, "Pay stub not found for this employee in this run")

    # Allowed fields to update
    allowed = {
        "hours_regular", "hours_overtime", "hours_stat_holiday", "hours_vacation",
        "hours_sick", "hours_evening", "hours_overnight", "hours_weekend",
        "hours_on_call", "hours_travel", "bonus", "commission", "reimbursement",
    }
    for k, v in body.items():
        if k not in allowed:
            continue
        if v is None or v == "":
            setattr(stub, k, 0)
        else:
            try:
                setattr(stub, k, Decimal(str(v)))
            except Exception:
                continue

    # Memo and skipped go into calculation_snapshot JSONB as transient state for draft mode
    if "memo" in body or "skipped" in body:
        snap = dict(stub.calculation_snapshot or {})
        if "memo" in body: snap["memo"] = body["memo"]
        if "skipped" in body: snap["skipped"] = bool(body["skipped"])
        stub.calculation_snapshot = snap

    await db.commit()
    await db.refresh(stub)
    return {"ok": True, "stub_id": str(stub.id)}


@router.post("/pay-runs", status_code=201)
async def create_pay_run(body: PayRunCreateBody, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not body.pay_stubs:
        raise HTTPException(400, "Pay run requires at least one pay stub")

    # Verify all employees belong to this owner
    emp_ids = [uuid.UUID(s.employee_id) for s in body.pay_stubs]
    emp_check = await db.execute(
        select(Employee.id).where(Employee.id.in_(emp_ids), Employee.owner_id == current_user.id)
    )
    valid_ids = {row[0] for row in emp_check.all()}
    if len(valid_ids) != len(emp_ids):
        raise HTTPException(403, "One or more employees do not belong to you")

    total_gross = sum(s.gross for s in body.pay_stubs)
    total_deductions = sum(s.deductions_total for s in body.pay_stubs)
    total_net = sum(s.net for s in body.pay_stubs)

    # Auto-attach default schedule
    sched_res2 = await db.execute(
        select(PaySchedule).where(
            PaySchedule.owner_id == current_user.id,
            PaySchedule.is_paused.is_(False),
        ).order_by(PaySchedule.is_default.desc(), PaySchedule.created_at.asc())
    )
    _default_sched2 = sched_res2.scalars().first()

    pr = PayRun(
        owner_id=current_user.id,
        pay_period_start=body.pay_period_start,
        pay_period_end=body.pay_period_end,
        pay_date=body.pay_date,
        pay_schedule_id=_default_sched2.id if _default_sched2 else None,
        status="approved",
        country=body.country,
        currency=body.currency,
        total_gross=Decimal(str(total_gross)),
        total_deductions=Decimal(str(total_deductions)),
        total_net=Decimal(str(total_net)),
        employee_count=len(body.pay_stubs),
        notes=body.notes,
        approved_at=datetime.utcnow(),
    )
    db.add(pr)
    await db.flush()  # get pr.id

    for s in body.pay_stubs:
        stub = PayStub(
            pay_run_id=pr.id,
            employee_id=uuid.UUID(s.employee_id),
            employee_name=s.employee_name,
            employee_email=s.employee_email,
            position_title=s.position_title,
            pay_type=s.pay_type,
            hours_worked=Decimal(str(s.hours_worked)) if s.hours_worked is not None else None,
            hourly_rate=Decimal(str(s.hourly_rate)) if s.hourly_rate is not None else None,
            gross=Decimal(str(s.gross)),
            deductions=s.deductions,
            deductions_total=Decimal(str(s.deductions_total)),
            net=Decimal(str(s.net)),
            currency=s.currency,
        )
        db.add(stub)

    await db.commit()
    await db.refresh(pr)

    stubs_result = await db.execute(select(PayStub).where(PayStub.pay_run_id == pr.id))
    return serialize_pay_run(pr, stubs_result.scalars().all())



# ============================================================================
# Identity verification (used before sending self-onboard invites)
# In-memory store; 5-min TTL; resets on service restart (fine for MVP).
# ============================================================================

import secrets as _secrets
_VERIFICATION_CODES = {}  # user_id (str) -> {code, expires_at, method, destination, attempts}


class VerifyCodeSendBody(BaseModel):
    method: str = "email"  # "text" | "email" | "call"


class VerifyCodeCheckBody(BaseModel):
    code: str


@router.post("/verify/send-code")
async def send_verification_code(body: VerifyCodeSendBody, current_user=Depends(get_current_user)):
    user_id = str(current_user.id)
    method = (body.method or "email").lower()
    if method not in ("email", "text", "call"):
        raise HTTPException(400, "Invalid verification method")

    user_email = getattr(current_user, "email", None)
    user_phone = getattr(current_user, "phone", None)

    if method == "email":
        destination = user_email or "(no email on file)"
    else:
        destination = user_phone or "(no phone on file — add one in account settings)"

    code = f"{_secrets.randbelow(900000) + 100000}"
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    _VERIFICATION_CODES[user_id] = {
        "code": code,
        "expires_at": expires_at,
        "method": method,
        "destination": destination,
        "attempts": 0,
    }

    delivered = False
    err_msg = None

    if method == "email" and HAS_SENDGRID and user_email:
        api_key = os.getenv("SENDGRID_API_KEY")
        if api_key:
            try:
                from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@getnovala.com")
                user_name = getattr(current_user, "full_name", None) or "there"
                body_html = f"""<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#1f2937;">
  <h1 style="color:#0F5959;font-size:24px;margin:0 0 16px 0;">Verification code</h1>
  <p style="font-size:15px;">Hi {user_name},</p>
  <p style="font-size:15px;">Use this code to verify your identity in Novala:</p>
  <div style="font-size:34px;font-weight:700;letter-spacing:10px;background:#F0FAFA;color:#0F5959;padding:20px;text-align:center;border-radius:10px;margin:24px 0;">{code}</div>
  <p style="font-size:13px;color:#6b7280;">This code expires in 5 minutes. If you didn't request it, you can safely ignore this email.</p>
</body></html>"""
                msg = Mail(from_email=from_email, to_emails=user_email,
                           subject=f"Novala verification code: {code}",
                           html_content=body_html)
                SendGridAPIClient(api_key).send(msg)
                delivered = True
            except Exception as e:
                err_msg = str(e)
                traceback.print_exc()

    # text/call: log to server for now (Twilio later). Always log so dev can grab it.
    print(f"[verify] user={user_id} method={method} dest={destination} code={code}")

    return {
        "success": True,
        "method": method,
        "destination": destination,
        "delivered": delivered,
        "error": err_msg,
    }


@router.post("/verify/check-code")
async def check_verification_code(body: VerifyCodeCheckBody, current_user=Depends(get_current_user)):
    user_id = str(current_user.id)
    stored = _VERIFICATION_CODES.get(user_id)

    if not stored:
        return {"valid": False, "reason": "No code sent (or already used)."}

    if stored["expires_at"] < datetime.utcnow():
        _VERIFICATION_CODES.pop(user_id, None)
        return {"valid": False, "reason": "Code expired."}

    stored["attempts"] += 1
    if stored["attempts"] > 10:
        _VERIFICATION_CODES.pop(user_id, None)
        return {"valid": False, "reason": "Too many attempts."}

    if stored["code"] != (body.code or "").strip():
        return {"valid": False, "reason": "Incorrect code."}

    # Valid — consume it
    _VERIFICATION_CODES.pop(user_id, None)
    return {"valid": True}


# ---------------------------------------------------------------------------
# Stat holiday: eligibility + ADW
# ---------------------------------------------------------------------------
@router.get("/stat-holiday/{employee_id}")
async def get_stat_holiday_info(
    employee_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return stat holiday eligibility and average daily wage for an employee.

    Alberta ESA rule: employee must have worked 30 workdays in the past 12 months.
    ADW = last 4 weeks of wages (excluding overtime) divided by days worked.
    """
    try:
        emp_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(400, "Invalid employee ID")

    # Load the employee
    result = await db.execute(
        select(Employee).where(
            Employee.id == emp_uuid,
            Employee.owner_id == current_user.id,
        )
    )
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(404, "Employee not found")

    today = date.today()
    year_ago = today - timedelta(days=365)
    four_weeks_ago = today - timedelta(days=28)

    hours_per_day = float(emp.hours_per_day) if getattr(emp, "hours_per_day", None) else 8.0
    if hours_per_day <= 0:
        hours_per_day = 8.0

    # Fetch pay stubs from the last 365 days (via pay_run.pay_period_end or pay_stub.created_at)
    # For simplicity we filter by created_at on PayStub.
    stubs_365 = await db.execute(
        select(PayStub).where(
            PayStub.employee_id == emp.id,
            PayStub.created_at >= datetime.combine(year_ago, datetime.min.time()),
        )
    )
    stubs_365_list = stubs_365.scalars().all()

    # Days worked in last 365 days
    total_work_hours_365 = 0.0
    for s in stubs_365_list:
        hr = float(s.hours_regular or 0)
        hs = float(s.hours_stat_holiday or 0)
        hv = float(s.hours_vacation or 0)
        total_work_hours_365 += hr + hs + hv
    days_worked_365 = total_work_hours_365 / hours_per_day if hours_per_day > 0 else 0.0

    # Alberta ESA: 30 workdays in prior 12 months
    days_needed = 30
    eligible = days_worked_365 >= days_needed

    # ADW: last 4 weeks wages (excluding overtime, bonus, commission, reimbursement)
    stubs_28 = [s for s in stubs_365_list if s.created_at.date() >= four_weeks_ago]
    adw_wages = 0.0
    adw_days = 0.0
    for s in stubs_28:
        hr = float(s.hours_regular or 0)
        hs = float(s.hours_stat_holiday or 0)
        h_ot = float(s.hours_overtime or 0)
        rate = float(s.hourly_rate or 0)
        gross = float(s.gross_pay or 0)
        bonus = float(s.bonus or 0)
        commission = float(s.commission or 0)
        reimb = float(s.reimbursement or 0)
        overtime_earnings = h_ot * rate * 1.5
        wages = gross - overtime_earnings - bonus - commission - reimb
        if wages < 0:
            wages = 0.0
        adw_wages += wages
        adw_days += (hr + hs) / hours_per_day if hours_per_day > 0 else 0.0

    adw_calc_available = adw_days > 0
    adw = (adw_wages / adw_days) if adw_calc_available else None

    # Regular workdays from tax_info
    tax_info = emp.tax_info if isinstance(emp.tax_info, dict) else (emp.tax_info or {})
    regular_workdays = tax_info.get("regular_workdays") if isinstance(tax_info, dict) else None
    if not isinstance(regular_workdays, list):
        # Default: guess from days_per_week (fall back to Mon-Fri)
        dpw = int(float(emp.days_per_week)) if getattr(emp, "days_per_week", None) else 5
        default_map = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        regular_workdays = default_map[:max(0, min(7, dpw))]

    hire_date_str = emp.start_date.isoformat() if getattr(emp, "start_date", None) else None
    days_since_hire = (today - emp.start_date).days if getattr(emp, "start_date", None) else None

    return {
        "eligible": bool(eligible),
        "days_worked": round(days_worked_365, 1),
        "days_needed": days_needed,
        "hours_worked": round(total_work_hours_365, 2),
        "hours_per_day": hours_per_day,
        "adw": round(adw, 2) if adw is not None else None,
        "adw_calc_available": adw_calc_available,
        "regular_workdays": regular_workdays,
        "hire_date": hire_date_str,
        "days_since_hire": days_since_hire,
    }


# ---------------------------------------------------------------------------
# Time off: vacation and sick pay info
# ---------------------------------------------------------------------------
@router.get("/time-off/{employee_id}")
async def get_time_off_info(
    employee_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return vacation and sick pay balances plus accrual estimates for an employee.

    Policy fields live in employee.tax_info JSON:
      - accrual_rate (percent of gross, e.g. 4.0)
      - balance_hours (current vacation hours balance)
      - sick_policy ("none" | "fixed" | "accrued")
      - sick_days_per_year (integer)
      - unpaid_leave_policy ("not_allowed" | "as_requested" | "with_approval")

    Accrued-this-year comes from finalized PayStubs in the current calendar year.
    Sick days used comes from finalized PayStubs with hours_sick > 0 this year.
    """
    try:
        emp_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(400, "Invalid employee ID")

    result = await db.execute(
        select(Employee).where(
            Employee.id == emp_uuid,
            Employee.owner_id == current_user.id,
        )
    )
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(404, "Employee not found")

    tax_info = emp.tax_info if isinstance(emp.tax_info, dict) else (emp.tax_info or {})

    # Policy fields (with sensible defaults)
    vacation_policy = emp.vacation_policy or "Accrued by hours worked"
    accrual_rate = float(tax_info.get("accrual_rate") or 0)  # percent
    balance_hours = float(tax_info.get("balance_hours") or 0)
    sick_policy = tax_info.get("sick_policy") or "none"
    sick_days_per_year = int(tax_info.get("sick_days_per_year") or 0)
    unpaid_leave_policy = tax_info.get("unpaid_leave_policy") or "as_requested"

    # Compute this-year accruals from finalized pay stubs
    from datetime import date as _date
    year_start = _date(_date.today().year, 1, 1)
    year_end = _date(_date.today().year, 12, 31)

    stubs_result = await db.execute(
        select(PayStub)
        .join(PayRun, PayRun.id == PayStub.pay_run_id)
        .where(
            PayStub.employee_id == emp.id,
            PayRun.status == "finalized",
            PayStub.created_at >= datetime.combine(year_start, datetime.min.time()),
            PayStub.created_at <= datetime.combine(year_end, datetime.max.time()),
        )
    )
    year_stubs = stubs_result.scalars().all()

    # Vacation accrued = sum of (gross_pay * accrual_rate%) OR sum of (hours_regular * rate) depending on policy.
    # For "Accrued by hours worked" style: accrued_dollars = accrual_rate% of gross.
    # We display hours: convert dollars back using average hourly rate from stubs.
    total_gross = sum(float(s.gross_pay or 0) for s in year_stubs)
    total_reg_hours = sum(float(s.hours_regular or 0) for s in year_stubs)
    avg_rate = (total_gross / total_reg_hours) if total_reg_hours > 0 else float(emp.hourly_rate or 0)
    accrued_dollars = total_gross * (accrual_rate / 100.0) if accrual_rate > 0 else 0.0
    accrued_hours = (accrued_dollars / avg_rate) if avg_rate > 0 else 0.0

    # Estimated payout on current balance at avg rate (or hourly_rate fallback)
    payout_rate = avg_rate if avg_rate > 0 else float(emp.hourly_rate or 0)
    estimated_payout = balance_hours * payout_rate

    # Sick days used this year
    sick_days_used = sum(1 for s in year_stubs if float(s.hours_sick or 0) > 0)
    sick_days_remaining = max(0, sick_days_per_year - sick_days_used) if sick_policy != "none" else 0
    yearly_reset = _date(_date.today().year + 1, 1, 1).isoformat()

    return {
        "vacation": {
            "policy": vacation_policy,
            "accrual_rate": accrual_rate,
            "balance_hours": round(balance_hours, 2),
            "estimated_payout": round(estimated_payout, 2),
            "accrued_this_year_hours": round(accrued_hours, 2),
            "accrued_this_year_dollars": round(accrued_dollars, 2),
        },
        "sick_pay": {
            "policy": sick_policy,
            "days_per_year": sick_days_per_year,
            "days_used": sick_days_used,
            "days_remaining": sick_days_remaining,
            "yearly_reset": yearly_reset,
        },
        "unpaid_leave": {
            "policy": unpaid_leave_policy,
        },
        "configured": (accrual_rate > 0 or balance_hours > 0 or sick_days_per_year > 0),
    }

