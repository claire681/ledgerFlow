"""
CRUD endpoints for employee_deduction_items: links between employees and deduction types.
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
from app.models.models import User, Employee, DeductionType, EmployeeDeductionItem

router = APIRouter(prefix="/employee-deduction-items", tags=["employee-deduction-items"])


class EmployeeDeductionItemCreate(BaseModel):
    employee_id: UUID
    deduction_type_id: UUID
    amount_override: Optional[Decimal] = None
    notes: Optional[str] = None


class EmployeeDeductionItemUpdate(BaseModel):
    amount_override: Optional[Decimal] = None
    is_active: Optional[bool] = None
    paused_at: Optional[datetime] = None
    notes: Optional[str] = None


def _serialize(item: EmployeeDeductionItem, dt: Optional[DeductionType] = None) -> dict:
    base = {
        "id": str(item.id),
        "employee_id": str(item.employee_id),
        "deduction_type_id": str(item.deduction_type_id),
        "amount_override": float(item.amount_override) if item.amount_override is not None else None,
        "is_active": item.is_active,
        "paused_at": item.paused_at.isoformat() if item.paused_at else None,
        "notes": item.notes,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
    }
    if dt:
        base["deduction_type"] = {
            "id": str(dt.id),
            "name": dt.name,
            "description": dt.description,
            "calc_method": dt.calc_method,
            "default_amount": float(dt.default_amount) if dt.default_amount is not None else None,
            "unit_label": dt.unit_label,
            "is_default": dt.is_default,
            "is_pre_tax": dt.is_pre_tax,
            "employer_matched": dt.employer_matched,
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


@router.get("/employee/{employee_id}")
async def list_for_employee(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _ensure_employee_owned(db, employee_id, current_user)
    result = await db.execute(
        select(EmployeeDeductionItem, DeductionType)
        .join(DeductionType, EmployeeDeductionItem.deduction_type_id == DeductionType.id)
        .where(EmployeeDeductionItem.employee_id == employee_id)
        .order_by(EmployeeDeductionItem.created_at)
    )
    rows = result.all()
    return [_serialize(item, dt) for item, dt in rows]


@router.post("", status_code=201)
async def create_item(
    body: EmployeeDeductionItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _ensure_employee_owned(db, body.employee_id, current_user)

    result = await db.execute(select(DeductionType).where(DeductionType.id == body.deduction_type_id))
    dt = result.scalar_one_or_none()
    if not dt:
        raise HTTPException(status_code=404, detail="Deduction type not found")
    if dt.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this deduction type")

    item = EmployeeDeductionItem(
        employee_id=body.employee_id,
        deduction_type_id=body.deduction_type_id,
        owner_id=current_user.id,
        amount_override=body.amount_override,
        notes=body.notes,
        is_active=True,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _serialize(item, dt)


@router.patch("/{item_id}")
async def update_item(
    item_id: UUID,
    body: EmployeeDeductionItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(EmployeeDeductionItem).where(EmployeeDeductionItem.id == item_id))
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

    result = await db.execute(select(DeductionType).where(DeductionType.id == item.deduction_type_id))
    dt = result.scalar_one_or_none()
    return _serialize(item, dt)


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(EmployeeDeductionItem).where(EmployeeDeductionItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(item)
    await db.commit()
    return None
