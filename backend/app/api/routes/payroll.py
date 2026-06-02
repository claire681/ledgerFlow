from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any
from decimal import Decimal
import uuid
import secrets
import os
import traceback

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import Employee, PayrollSettings
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
