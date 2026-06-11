from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import WorkLocation, Employee, User

router = APIRouter(prefix="/work-locations", tags=["Work Locations"])


# ----- Schemas -----
class WorkLocationBase(BaseModel):
    is_primary: Optional[bool] = False
    status: Optional[str] = "active"
    street_address: Optional[str] = None
    municipality: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "CA"


class WorkLocationCreate(WorkLocationBase):
    pass


class WorkLocationUpdate(BaseModel):
    is_primary: Optional[bool] = None
    status: Optional[str] = None
    street_address: Optional[str] = None
    municipality: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None


class AssignedEmployeeOut(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    status: str

    class Config:
        from_attributes = True


class WorkLocationOut(BaseModel):
    id: UUID
    is_primary: bool
    status: str
    street_address: Optional[str] = None
    municipality: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    created_at: datetime
    updated_at: datetime
    assigned_employees: List[AssignedEmployeeOut] = []

    class Config:
        from_attributes = True


# ----- Helpers -----
async def _hydrate(location: WorkLocation, db: AsyncSession) -> dict:
    emp_result = await db.execute(
        select(Employee).where(Employee.work_location_id == location.id)
    )
    emps = emp_result.scalars().all()
    return {
        "id": location.id,
        "is_primary": location.is_primary,
        "status": location.status,
        "street_address": location.street_address,
        "municipality": location.municipality,
        "province": location.province,
        "postal_code": location.postal_code,
        "country": location.country,
        "created_at": location.created_at,
        "updated_at": location.updated_at,
        "assigned_employees": [
            {"id": e.id, "first_name": e.first_name, "last_name": e.last_name, "status": e.status}
            for e in emps
        ],
    }


async def _get_owned(location_id: UUID, current_user: User, db: AsyncSession) -> WorkLocation:
    result = await db.execute(
        select(WorkLocation)
        .where(WorkLocation.id == location_id)
        .where(WorkLocation.owner_id == current_user.id)
        .where(WorkLocation.deleted_at.is_(None))
    )
    location = result.scalars().first()
    if not location:
        raise HTTPException(status_code=404, detail="Work location not found")
    return location


# ----- Endpoints -----
@router.get("", response_model=List[WorkLocationOut])
async def list_work_locations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(WorkLocation)
        .where(WorkLocation.owner_id == current_user.id)
        .where(WorkLocation.deleted_at.is_(None))
        .order_by(WorkLocation.is_primary.desc(), WorkLocation.created_at.asc())
    )
    locations = result.scalars().all()
    return [await _hydrate(loc, db) for loc in locations]


@router.post("", response_model=WorkLocationOut, status_code=status.HTTP_201_CREATED)
async def create_work_location(
    payload: WorkLocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count_result = await db.execute(
        select(func.count(WorkLocation.id))
        .where(WorkLocation.owner_id == current_user.id)
        .where(WorkLocation.deleted_at.is_(None))
    )
    is_first = (count_result.scalar() or 0) == 0

    location = WorkLocation(
        owner_id=current_user.id,
        is_primary=payload.is_primary if payload.is_primary is not None else is_first,
        status=payload.status or "active",
        street_address=payload.street_address,
        municipality=payload.municipality,
        province=payload.province,
        postal_code=payload.postal_code,
        country=payload.country or "CA",
    )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return await _hydrate(location, db)


@router.get("/{location_id}", response_model=WorkLocationOut)
async def get_work_location(
    location_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = await _get_owned(location_id, current_user, db)
    return await _hydrate(location, db)


@router.patch("/{location_id}", response_model=WorkLocationOut)
async def update_work_location(
    location_id: UUID,
    payload: WorkLocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = await _get_owned(location_id, current_user, db)
    update_data = payload.dict(exclude_unset=True)

    # Guard: cannot make inactive if primary or has active employees
    if update_data.get("status") == "inactive":
        if location.is_primary:
            raise HTTPException(status_code=400, detail="A primary location cannot be made inactive")
        active_result = await db.execute(
            select(func.count(Employee.id))
            .where(Employee.work_location_id == location.id)
            .where(Employee.status == "active")
        )
        if (active_result.scalar() or 0) > 0:
            raise HTTPException(status_code=400, detail="Cannot make inactive: this location has active assigned employees")

    for field, value in update_data.items():
        setattr(location, field, value)

    await db.commit()
    await db.refresh(location)
    return await _hydrate(location, db)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_work_location(
    location_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    location = await _get_owned(location_id, current_user, db)

    if location.is_primary:
        raise HTTPException(status_code=400, detail="A primary location cannot be deleted")

    assigned_result = await db.execute(
        select(func.count(Employee.id))
        .where(Employee.work_location_id == location.id)
    )
    if (assigned_result.scalar() or 0) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete: this location has assigned employees. Reassign them first.")

    location.deleted_at = func.now()
    await db.commit()
    return None
