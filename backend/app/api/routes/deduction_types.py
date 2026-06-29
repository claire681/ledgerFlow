from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import DeductionType, User

router = APIRouter(prefix="/deduction-types", tags=["Deduction Types"])

# ============================================================
# Deduction Type schemas
# ============================================================
class DeductionTypeBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = "CA"
    is_active: Optional[bool] = True
    calc_method: Optional[str] = "fixed"
    default_amount: Optional[float] = None
    unit_label: Optional[str] = None
    is_pre_tax: Optional[bool] = False
    employer_matched: Optional[bool] = False
    country_flags: Optional[Dict[str, Any]] = {}


class DeductionTypeCreate(DeductionTypeBase):
    pass


class DeductionTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    calc_method: Optional[str] = None
    default_amount: Optional[float] = None
    unit_label: Optional[str] = None
    is_pre_tax: Optional[bool] = None
    employer_matched: Optional[bool] = None
    country_flags: Optional[Dict[str, Any]] = None


def _serialize_deduction_type(d: DeductionType) -> dict:
    return {
        "id": str(d.id),
        "owner_id": str(d.owner_id),
        "name": d.name,
        "description": d.description,
        "country": d.country,
        "is_default": d.is_default,
        "is_active": d.is_active,
        "calc_method": d.calc_method,
        "default_amount": float(d.default_amount) if d.default_amount is not None else None,
        "unit_label": d.unit_label,
        "is_pre_tax": d.is_pre_tax,
        "employer_matched": d.employer_matched,
        "country_flags": d.country_flags or {},
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }


@router.get("")
async def list_deduction_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DeductionType).where(
            DeductionType.owner_id == current_user.id,
            DeductionType.deleted_at.is_(None),
        ).order_by(DeductionType.is_default.desc(), DeductionType.created_at.asc())
    )
    deductions = result.scalars().all()
    return [_serialize_deduction_type(d) for d in deductions]


@router.get("/{deduction_id}")
async def get_deduction_type(
    deduction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DeductionType).where(
            DeductionType.id == deduction_id,
            DeductionType.owner_id == current_user.id,
            DeductionType.deleted_at.is_(None),
        )
    )
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Deduction type not found")
    return _serialize_deduction_type(d)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_deduction_type(
    body: DeductionTypeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.name or not body.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    data = body.dict(exclude_unset=True)
    data["is_default"] = False
    data["owner_id"] = current_user.id

    d = DeductionType(**data)
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return _serialize_deduction_type(d)


@router.patch("/{deduction_id}")
async def update_deduction_type(
    deduction_id: UUID,
    body: DeductionTypeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DeductionType).where(
            DeductionType.id == deduction_id,
            DeductionType.owner_id == current_user.id,
            DeductionType.deleted_at.is_(None),
        )
    )
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Deduction type not found")

    update_data = body.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(d, field, value)

    await db.commit()
    await db.refresh(d)
    return _serialize_deduction_type(d)


@router.delete("/{deduction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deduction_type(
    deduction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DeductionType).where(
            DeductionType.id == deduction_id,
            DeductionType.owner_id == current_user.id,
            DeductionType.deleted_at.is_(None),
        )
    )
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Deduction type not found")

    if d.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default deduction types. You can deactivate them instead.")

    d.deleted_at = datetime.utcnow()
    await db.commit()
    return None
