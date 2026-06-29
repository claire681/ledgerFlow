"""
CRUD endpoints for employee_pay_items: links between employees and pay types.
"""
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Employee, PayType, EmployeePayItem

router = APIRouter(prefix="/employee-pay-items", tags=["employee-pay-items"])


# === Pydantic schemas ===
class EmployeePayItemCreate(BaseModel):
    employee_id: UUID
    pay_type_id: UUID
    rate_override: Optional[Decimal] = None
    unit_label_override: Optional[str] = None
    notes: Optional[str] = None


class EmployeePayItemUpdate(BaseModel):
    rate_override: Optional[Decimal] = None
    unit_label_override: Optional[str] = None
    is_active: Optional[bool] = None
    paused_at: Optional[datetime] = None
    notes: Optional[str] = None


def _serialize(item: EmployeePayItem, pay_type: Optional[PayType] = None) -> dict:
    """Return as plain dict. Optionally enriches with pay_type details."""
    base = {
        "id": str(item.id),
        "employee_id": str(item.employee_id),
        "pay_type_id": str(item.pay_type_id),
        "rate_override": float(item.rate_override) if item.rate_override is not None else None,
        "unit_label_override": item.unit_label_override,
        "is_active": item.is_active,
        "paused_at": item.paused_at.isoformat() if item.paused_at else None,
        "notes": item.notes,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
    }
    if pay_type:
        base["pay_type"] = {
            "id": str(pay_type.id),
            "name": pay_type.name,
            "description": pay_type.description,
            "calc_method": pay_type.calc_method,
            "default_rate": float(pay_type.default_rate) if pay_type.default_rate is not None else None,
            "unit_label": pay_type.unit_label,
            "is_default": pay_type.is_default,
            "federal_taxable": pay_type.federal_taxable,
            "cpp_contributable": pay_type.cpp_contributable,
            "ei_insurable": pay_type.ei_insurable,
            "vacationable": pay_type.vacationable,
            "wcb_reportable": pay_type.wcb_reportable,
            "t4_box": pay_type.t4_box,
        }
    return base


async def _ensure_employee_owned(db: AsyncSession, employee_id: UUID, current_user: User) -> Employee:
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if employee.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this employee")
    return employee


# === LIST for an employee ===
@router.get("/employee/{employee_id}")
async def list_for_employee(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _ensure_employee_owned(db, employee_id, current_user)
    result = await db.execute(
        select(EmployeePayItem, PayType)
        .join(PayType, EmployeePayItem.pay_type_id == PayType.id)
        .where(EmployeePayItem.employee_id == employee_id)
        .order_by(EmployeePayItem.created_at)
    )
    rows = result.all()
    return [_serialize(item, pt) for item, pt in rows]


# === CREATE ===
@router.post("", status_code=201)
async def create_item(
    body: EmployeePayItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _ensure_employee_owned(db, body.employee_id, current_user)

    # Verify pay_type belongs to current user
    result = await db.execute(select(PayType).where(PayType.id == body.pay_type_id))
    pay_type = result.scalar_one_or_none()
    if not pay_type:
        raise HTTPException(status_code=404, detail="Pay type not found")
    if pay_type.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this pay type")

    item = EmployeePayItem(
        employee_id=body.employee_id,
        pay_type_id=body.pay_type_id,
        owner_id=current_user.id,
        rate_override=body.rate_override,
        unit_label_override=body.unit_label_override,
        notes=body.notes,
        is_active=True,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _serialize(item, pay_type)


# === UPDATE ===
@router.patch("/{item_id}")
async def update_item(
    item_id: UUID,
    body: EmployeePayItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(EmployeePayItem).where(EmployeePayItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = body.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)

    # Re-fetch pay_type for enriched response
    result = await db.execute(select(PayType).where(PayType.id == item.pay_type_id))
    pay_type = result.scalar_one_or_none()
    return _serialize(item, pay_type)


# === DELETE (hard delete - this is an assignment, not catalog data) ===
@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(EmployeePayItem).where(EmployeePayItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(item)
    await db.commit()
    return None
