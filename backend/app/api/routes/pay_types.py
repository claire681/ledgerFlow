from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import PayType, DeductionType, User

router = APIRouter(prefix="/pay-types", tags=["Pay Types"])

# ============================================================
# Pay Type schemas
# ============================================================
class PayTypeBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = "CA"
    is_active: Optional[bool] = True
    calc_method: Optional[str] = "fixed"
    default_rate: Optional[float] = None
    unit_label: Optional[str] = None
    federal_taxable: Optional[bool] = True
    cpp_contributable: Optional[bool] = True
    ei_insurable: Optional[bool] = True
    vacationable: Optional[bool] = True
    wcb_reportable: Optional[bool] = True
    t4_box: Optional[str] = "14"
    country_flags: Optional[Dict[str, Any]] = {}


class PayTypeCreate(PayTypeBase):
    pass


class PayTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    calc_method: Optional[str] = None
    default_rate: Optional[float] = None
    unit_label: Optional[str] = None
    federal_taxable: Optional[bool] = None
    cpp_contributable: Optional[bool] = None
    ei_insurable: Optional[bool] = None
    vacationable: Optional[bool] = None
    wcb_reportable: Optional[bool] = None
    t4_box: Optional[str] = None
    country_flags: Optional[Dict[str, Any]] = None


class PayTypeOut(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    description: Optional[str]
    country: str
    is_default: bool
    is_active: bool
    calc_method: str
    default_rate: Optional[float]
    unit_label: Optional[str]
    federal_taxable: bool
    cpp_contributable: bool
    ei_insurable: bool
    vacationable: bool
    wcb_reportable: bool
    t4_box: Optional[str]
    country_flags: Dict[str, Any]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Helper to serialize PayType to dict (avoids serialization edge cases)
def _serialize_pay_type(p: PayType) -> dict:
    return {
        "id": str(p.id),
        "owner_id": str(p.owner_id),
        "name": p.name,
        "description": p.description,
        "country": p.country,
        "is_default": p.is_default,
        "is_active": p.is_active,
        "calc_method": p.calc_method,
        "default_rate": float(p.default_rate) if p.default_rate is not None else None,
        "unit_label": p.unit_label,
        "federal_taxable": p.federal_taxable,
        "cpp_contributable": p.cpp_contributable,
        "ei_insurable": p.ei_insurable,
        "vacationable": p.vacationable,
        "wcb_reportable": p.wcb_reportable,
        "t4_box": p.t4_box,
        "country_flags": p.country_flags or {},
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


# ============================================================
# Pay Type endpoints
# ============================================================

@router.get("")
async def list_pay_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all pay types for the current owner (excludes soft-deleted)"""
    result = await db.execute(
        select(PayType).where(
            PayType.owner_id == current_user.id,
            PayType.deleted_at.is_(None),
        ).order_by(PayType.is_default.desc(), PayType.created_at.asc())
    )
    pay_types = result.scalars().all()
    return [_serialize_pay_type(pt) for pt in pay_types]


@router.get("/{pay_type_id}")
async def get_pay_type(
    pay_type_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PayType).where(
            PayType.id == pay_type_id,
            PayType.owner_id == current_user.id,
            PayType.deleted_at.is_(None),
        )
    )
    pt = result.scalar_one_or_none()
    if not pt:
        raise HTTPException(status_code=404, detail="Pay type not found")
    return _serialize_pay_type(pt)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_pay_type(
    body: PayTypeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.name or not body.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    data = body.dict(exclude_unset=True)
    # Custom items created via API are never marked as default
    data["is_default"] = False
    data["owner_id"] = current_user.id

    pt = PayType(**data)
    db.add(pt)
    await db.commit()
    await db.refresh(pt)
    return _serialize_pay_type(pt)


@router.patch("/{pay_type_id}")
async def update_pay_type(
    pay_type_id: UUID,
    body: PayTypeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PayType).where(
            PayType.id == pay_type_id,
            PayType.owner_id == current_user.id,
            PayType.deleted_at.is_(None),
        )
    )
    pt = result.scalar_one_or_none()
    if not pt:
        raise HTTPException(status_code=404, detail="Pay type not found")

    update_data = body.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pt, field, value)

    await db.commit()
    await db.refresh(pt)
    return _serialize_pay_type(pt)


@router.delete("/{pay_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pay_type(
    pay_type_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PayType).where(
            PayType.id == pay_type_id,
            PayType.owner_id == current_user.id,
            PayType.deleted_at.is_(None),
        )
    )
    pt = result.scalar_one_or_none()
    if not pt:
        raise HTTPException(status_code=404, detail="Pay type not found")

    # Block deletion of default items (seeded defaults are permanent)
    if pt.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default pay types. You can deactivate them instead.")

    # Soft delete
    pt.deleted_at = datetime.utcnow()
    await db.commit()
    return None
