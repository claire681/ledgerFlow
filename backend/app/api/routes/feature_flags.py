"""Feature Flag admin API - Phase 1 Zero-downtime deployment infrastructure.

Only admins can create/update/delete flags.
Changes take effect within 60 seconds (cache TTL).
"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import FeatureFlag, User
from app.features import clear_cache

router = APIRouter(prefix="/admin/feature-flags", tags=["Admin - Feature Flags"])


# --- Schemas ---------------------------------------------------------

class FeatureFlagCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    enabled: bool = False
    rollout_percentage: int = Field(0, ge=0, le=100)
    targeting_rules: dict = Field(default_factory=dict)


class FeatureFlagUpdate(BaseModel):
    description: Optional[str] = None
    enabled: Optional[bool] = None
    rollout_percentage: Optional[int] = Field(None, ge=0, le=100)
    targeting_rules: Optional[dict] = None


class FeatureFlagResponse(BaseModel):
    id: str
    key: str
    description: Optional[str]
    enabled: bool
    rollout_percentage: int
    targeting_rules: dict
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str]

    class Config:
        from_attributes = True


# --- Helper ----------------------------------------------------------

def _require_admin(user: User) -> None:
    """Ensure the current user has admin role."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required to manage feature flags",
        )


def _to_response(flag: FeatureFlag) -> dict:
    return {
        "id": str(flag.id),
        "key": flag.key,
        "description": flag.description,
        "enabled": flag.enabled,
        "rollout_percentage": flag.rollout_percentage,
        "targeting_rules": flag.targeting_rules or {},
        "created_at": flag.created_at,
        "updated_at": flag.updated_at,
        "created_by": flag.created_by,
    }


# --- List all flags --------------------------------------------------

@router.get("/", response_model=list[FeatureFlagResponse])
async def list_flags(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all feature flags."""
    _require_admin(current_user)
    result = await db.execute(select(FeatureFlag).order_by(FeatureFlag.key))
    flags = result.scalars().all()
    return [_to_response(f) for f in flags]


# --- Get single flag -------------------------------------------------

@router.get("/{key}", response_model=FeatureFlagResponse)
async def get_flag(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get one feature flag by key."""
    _require_admin(current_user)
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    flag = result.scalar_one_or_none()
    if flag is None:
        raise HTTPException(status_code=404, detail=f"Feature flag '{key}' not found")
    return _to_response(flag)


# --- Create flag -----------------------------------------------------

@router.post("/", response_model=FeatureFlagResponse, status_code=201)
async def create_flag(
    data: FeatureFlagCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new feature flag."""
    _require_admin(current_user)

    # Check duplicate
    existing = await db.execute(select(FeatureFlag).where(FeatureFlag.key == data.key))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail=f"Feature flag '{data.key}' already exists")

    flag = FeatureFlag(
        id=uuid.uuid4(),
        key=data.key,
        description=data.description,
        enabled=data.enabled,
        rollout_percentage=data.rollout_percentage,
        targeting_rules=data.targeting_rules,
        created_by=current_user.email,
    )
    db.add(flag)
    await db.commit()
    await db.refresh(flag)
    clear_cache()
    return _to_response(flag)


# --- Update flag -----------------------------------------------------

@router.patch("/{key}", response_model=FeatureFlagResponse)
async def update_flag(
    key: str,
    data: FeatureFlagUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing feature flag (partial - only non-null fields change)."""
    _require_admin(current_user)

    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    flag = result.scalar_one_or_none()
    if flag is None:
        raise HTTPException(status_code=404, detail=f"Feature flag '{key}' not found")

    if data.description is not None:
        flag.description = data.description
    if data.enabled is not None:
        flag.enabled = data.enabled
    if data.rollout_percentage is not None:
        flag.rollout_percentage = data.rollout_percentage
    if data.targeting_rules is not None:
        flag.targeting_rules = data.targeting_rules

    await db.commit()
    await db.refresh(flag)
    clear_cache()
    return _to_response(flag)


# --- Delete flag -----------------------------------------------------

@router.delete("/{key}", status_code=204)
async def delete_flag(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a feature flag."""
    _require_admin(current_user)

    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    flag = result.scalar_one_or_none()
    if flag is None:
        raise HTTPException(status_code=404, detail=f"Feature flag '{key}' not found")

    await db.execute(delete(FeatureFlag).where(FeatureFlag.key == key))
    await db.commit()
    clear_cache()
