"""API version discovery endpoints.

Public - no auth required. Lets integrators check version status.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.versioning import all_versions, current_version


router = APIRouter(prefix="/api/versions", tags=["API Versions"])


class VersionInfoResponse(BaseModel):
    version: str
    released_at: date
    is_current: bool
    deprecated: bool
    sunset_date: Optional[date]
    notes: str


class VersionsListResponse(BaseModel):
    current: str
    versions: list[VersionInfoResponse]


@router.get("", response_model=VersionsListResponse)
async def list_versions():
    """List all API versions with their status.

    Public endpoint - integrators use this to check if their version is deprecated.
    """
    current = current_version()
    return VersionsListResponse(
        current=current.version,
        versions=[
            VersionInfoResponse(
                version=v.version,
                released_at=v.released_at,
                is_current=v.is_current,
                deprecated=v.deprecated,
                sunset_date=v.sunset_date,
                notes=v.notes,
            )
            for v in all_versions()
        ],
    )
