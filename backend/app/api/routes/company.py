"""
LedgerFlow Company Profile Routes
Manages the user's business profile — used as defaults across the whole app.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import CompanyProfile, User
from app.services.memory_service import observe_and_update_memory
from app.services.activity_service import log_activity
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/company", tags=["Company"])


# ── Schemas ───────────────────────────────────────────────────────────────

class CompanyProfileSchema(BaseModel):
    company_name:       Optional[str]   = None
    business_type:      Optional[str]   = "corporation"
    industry:           Optional[str]   = None
    website:            Optional[str]   = None
    phone:              Optional[str]   = None
    contact_email:      Optional[str]   = None
    logo_url:           Optional[str]   = None
    address:            Optional[str]   = None
    country:            Optional[str]   = "US"
    province_state:     Optional[str]   = None
    currency:           Optional[str]   = "USD"
    fiscal_year_start:  Optional[int]   = 1
    tax_year:           Optional[int]   = None
    vat_registered:     Optional[bool]  = False
    vat_number:         Optional[str]   = None
    annual_revenue_est: Optional[float] = None
    employee_count:     Optional[int]   = None
    founded_year:       Optional[int]   = None

    class Config:
        from_attributes = True


class CompanyProfileResponse(CompanyProfileSchema):
    id:         str
    user_id:    str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── GET profile ───────────────────────────────────────────────────────────

@router.get("/profile", response_model=CompanyProfileResponse)
async def get_company_profile(
    current_user: User    = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Get the current user's company profile."""
    result = await db.execute(
        select(CompanyProfile).where(
            CompanyProfile.user_id == current_user.id
        )
    )
    profile = result.scalar_one_or_none()

    if not profile:
        # Auto-create empty profile on first access
        profile = CompanyProfile(
            user_id      = current_user.id,
            company_name = current_user.company or "",
            currency     = "USD",
            country      = "US",
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


# ── POST / update profile ─────────────────────────────────────────────────

@router.post("/profile", response_model=CompanyProfileResponse)
async def save_company_profile(
    data:         CompanyProfileSchema,
    current_user: User           = Depends(get_current_user),
    db:           AsyncSession   = Depends(get_db),
):
    """Create or update the company profile."""
    result = await db.execute(
        select(CompanyProfile).where(
            CompanyProfile.user_id == current_user.id
        )
    )
    profile = result.scalar_one_or_none()

    if profile:
        # Update existing
        for key, value in data.dict(exclude_unset=True).items():
            setattr(profile, key, value)
        profile.updated_at = datetime.utcnow()
    else:
        # Create new
        profile = CompanyProfile(
            user_id = current_user.id,
            **data.dict(exclude_unset=True),
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)

    # Update AI memory with new profile data
    await observe_and_update_memory(db, current_user.id)

    # Log activity
    await log_activity(
        db, current_user.id,
        action_type = "profile_updated",
        page        = "company_profile",
        action_data = {"company_name": profile.company_name},
    )

    return profile


# ── PATCH profile ─────────────────────────────────────────────────────────

@router.patch("/profile", response_model=CompanyProfileResponse)
async def patch_company_profile(
    data:         CompanyProfileSchema,
    current_user: User           = Depends(get_current_user),
    db:           AsyncSession   = Depends(get_db),
):
    """Partially update the company profile."""
    result = await db.execute(
        select(CompanyProfile).where(
            CompanyProfile.user_id == current_user.id
        )
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    for key, value in data.dict(exclude_unset=True).items():
        if value is not None:
            setattr(profile, key, value)

    profile.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(profile)

    # Update AI memory
    await observe_and_update_memory(db, current_user.id)

    return profile