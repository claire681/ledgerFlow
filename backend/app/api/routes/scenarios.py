"""
LedgerFlow What-If Scenario Routes
Save and retrieve tax scenario comparisons.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import WhatIfScenario, User
from app.services.activity_service import log_activity
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


# ── Schemas ───────────────────────────────────────────────────────────────

class ScenarioCreate(BaseModel):
    title:        Optional[str]   = None
    a_label:      Optional[str]   = "Scenario A"
    a_country:    Optional[str]   = None
    a_province:   Optional[str]   = None
    a_revenue:    float           = 0.0
    a_deductions: float           = 0.0
    a_total_tax:  float           = 0.0
    a_net_profit: float           = 0.0
    a_result_json:Optional[dict]  = {}
    b_label:      Optional[str]   = "Scenario B"
    b_country:    Optional[str]   = None
    b_province:   Optional[str]   = None
    b_revenue:    float           = 0.0
    b_deductions: float           = 0.0
    b_total_tax:  float           = 0.0
    b_net_profit: float           = 0.0
    b_result_json:Optional[dict]  = {}
    ai_comparison:Optional[str]   = None

    class Config:
        from_attributes = True


class ScenarioResponse(ScenarioCreate):
    id:         str
    user_id:    str
    created_at: Optional[datetime] = None


# ── LIST scenarios ────────────────────────────────────────────────────────

@router.get("/", response_model=list[ScenarioResponse])
async def list_scenarios(
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """List all saved what-if scenarios."""
    result = await db.execute(
        select(WhatIfScenario)
        .where(WhatIfScenario.user_id == current_user.id)
        .order_by(desc(WhatIfScenario.created_at))
    )
    return result.scalars().all()


# ── GET single scenario ───────────────────────────────────────────────────

@router.get("/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(
    scenario_id:  str,
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Get a single scenario by ID."""
    result = await db.execute(
        select(WhatIfScenario).where(
            WhatIfScenario.id      == scenario_id,
            WhatIfScenario.user_id == current_user.id,
        )
    )
    scenario = result.scalar_one_or_none()

    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    return scenario


# ── CREATE scenario ───────────────────────────────────────────────────────

@router.post("/", response_model=ScenarioResponse)
async def create_scenario(
    data:         ScenarioCreate,
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Save a new what-if scenario comparison."""
    scenario = WhatIfScenario(
        user_id = current_user.id,
        **data.dict(exclude_unset=True),
    )

    if not scenario.title:
        scenario.title = f"Scenario — {datetime.utcnow().strftime('%b %d, %Y')}"

    db.add(scenario)
    await db.commit()
    await db.refresh(scenario)

    await log_activity(
        db, current_user.id,
        action_type = "scenario_saved",
        page        = "tax_calculator",
        action_data = {
            "scenario_id": scenario.id,
            "a_country":   data.a_country,
            "b_country":   data.b_country,
        },
    )

    return scenario


# ── DELETE scenario ───────────────────────────────────────────────────────

@router.delete("/{scenario_id}")
async def delete_scenario(
    scenario_id:  str,
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Delete a scenario."""
    result = await db.execute(
        select(WhatIfScenario).where(
            WhatIfScenario.id      == scenario_id,
            WhatIfScenario.user_id == current_user.id,
        )
    )
    scenario = result.scalar_one_or_none()

    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    await db.delete(scenario)
    await db.commit()

    return {"message": "Scenario deleted successfully"}