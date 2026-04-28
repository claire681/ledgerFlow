"""
LedgerFlow User Preferences Routes
Stores and retrieves user preferences that persist across sessions.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import UserPreference, User
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/preferences", tags=["Preferences"])


# ── Schemas ───────────────────────────────────────────────────────────────

class PreferenceItem(BaseModel):
    key:   str
    value: str


class PreferencesResponse(BaseModel):
    preferences: dict


# ── GET all preferences ───────────────────────────────────────────────────

@router.get("/", response_model=PreferencesResponse)
async def get_preferences(
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Get all preferences for the current user as a key-value dict."""
    result = await db.execute(
        select(UserPreference).where(
            UserPreference.user_id == current_user.id
        )
    )
    prefs = result.scalars().all()

    return {
        "preferences": {p.preference_key: p.preference_value for p in prefs}
    }


# ── POST set preference ───────────────────────────────────────────────────

@router.post("/")
async def set_preference(
    data:         PreferenceItem,
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Set a single preference value."""
    result = await db.execute(
        select(UserPreference).where(
            UserPreference.user_id       == current_user.id,
            UserPreference.preference_key == data.key,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.preference_value = data.value
        existing.updated_at       = datetime.utcnow()
    else:
        pref = UserPreference(
            user_id          = current_user.id,
            preference_key   = data.key,
            preference_value = data.value,
        )
        db.add(pref)

    await db.commit()

    return {"message": f"Preference '{data.key}' saved", "key": data.key, "value": data.value}


# ── POST set multiple preferences ─────────────────────────────────────────

@router.post("/bulk")
async def set_preferences_bulk(
    data:         dict,
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Set multiple preferences at once."""
    for key, value in data.items():
        result = await db.execute(
            select(UserPreference).where(
                UserPreference.user_id        == current_user.id,
                UserPreference.preference_key == key,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.preference_value = str(value)
            existing.updated_at       = datetime.utcnow()
        else:
            pref = UserPreference(
                user_id          = current_user.id,
                preference_key   = key,
                preference_value = str(value),
            )
            db.add(pref)

    await db.commit()

    return {"message": f"{len(data)} preferences saved"}


# ── DELETE preference ─────────────────────────────────────────────────────

@router.delete("/{key}")
async def delete_preference(
    key:          str,
    current_user: User         = Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    """Delete a single preference."""
    result = await db.execute(
        select(UserPreference).where(
            UserPreference.user_id        == current_user.id,
            UserPreference.preference_key == key,
        )
    )
    pref = result.scalar_one_or_none()

    if pref:
        await db.delete(pref)
        await db.commit()

    return {"message": f"Preference '{key}' deleted"}