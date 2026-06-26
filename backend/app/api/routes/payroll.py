from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, List
from decimal import Decimal
import uuid
import secrets
import os
import traceback

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import Employee, PayrollSettings, PayRun, PayStub
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


class EmployeeUpdateBody(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    preferred_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    sin_or_ssn: Optional[str] = None
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
    employment_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    manager_name: Optional[str] = None
    pay_type: Optional[str] = None
    salary_amount: Optional[float] = None
    hourly_rate: Optional[float] = None
    hours_per_week: Optional[float] = None
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
        "department": e.department, "employment_type": e.employment_type,
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
        "currency": s.currency,
        "custom_deduction_rates": s.custom_deduction_rates or {},
        "company_bank_name": s.company_bank_name,
        "company_transit_number": s.company_transit_number,
        "company_institution_number": s.company_institution_number,
        "company_routing_number": s.company_routing_number,
        "company_account_number_encrypted": s.company_account_number_encrypted,
        "business_number": s.business_number, "ein": s.ein,
        "payroll_active": s.payroll_active,
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
    return {
        "id": str(s.id),
        "pay_run_id": str(s.pay_run_id),
        "employee_id": str(s.employee_id),
        "employee_name": s.employee_name,
        "employee_email": s.employee_email,
        "position_title": s.position_title,
        "pay_type": s.pay_type,
        "hours_worked": float(s.hours_worked) if s.hours_worked is not None else None,
        "hourly_rate": float(s.hourly_rate) if s.hourly_rate is not None else None,
        "gross": float(s.gross or 0),
        "deductions": s.deductions or {},
        "deductions_total": float(s.deductions_total or 0),
        "net": float(s.net or 0),
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
    result = await db.execute(
        select(PayRun).where(
            PayRun.owner_id == current_user.id,
            PayRun.pay_period_start == period_start_d,
            PayRun.pay_period_end == period_end_d,
            PayRun.status == "draft",
        )
    )
    pr = result.scalar_one_or_none()

    if pr is None:
        # Create a new draft. Seed one PayStub per active employee.
        pr = PayRun(
            owner_id=current_user.id,
            pay_period_start=period_start_d,
            pay_period_end=period_end_d,
            pay_date=pay_date_d,
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

    pr = PayRun(
        owner_id=current_user.id,
        pay_period_start=body.pay_period_start,
        pay_period_end=body.pay_period_end,
        pay_date=body.pay_date,
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
