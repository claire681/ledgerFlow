from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

class OnboardingUpdate(BaseModel):
    step:         int
    completed:    bool          = False
    company_name: Optional[str] = None

@router.get("/status")
async def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {
        "onboarding_completed": current_user.onboarding_completed or False,
        "onboarding_step":      current_user.onboarding_step      or 0,
        "company_name":         current_user.company_name         or "",
    }

@router.post("/update")
async def update_onboarding(
    data: OnboardingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    values = {
        "onboarding_step":      data.step,
        "onboarding_completed": data.completed,
    }
    if data.company_name is not None:
        values["company_name"] = data.company_name

    await db.execute(
        update(User).where(User.id == current_user.id).values(**values)
    )
    await db.commit()
    return { "success": True, "step": data.step, "completed": data.completed }
