"""Pay Schedules API - CRUD + lifecycle operations.

Mount at prefix "/api/v1/payroll" alongside pay_runs.py.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import PaySchedule, Employee, User
from app.core.security import get_current_user
from app.payroll.schedule_helpers import (
    next_pay_date,
    upcoming_pay_dates,
    compute_period_for_pay_date,
    is_schedule_due,
    periods_per_year_for_schedule,
)


router = APIRouter()


class PayScheduleCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    frequency: str
    pay_day_of_week: Optional[int] = None
    pay_day_1: Optional[int] = None
    pay_day_2: Optional[int] = None
    first_pay_date: date
    first_period_start: date
    first_period_end: date
    holiday_shift: bool = True
    weekend_shift: bool = True
    auto_run_enabled: bool = False
    auto_run_days_before: int = 2
    is_default: bool = False
    color: str = "#15A08C"


class PayScheduleUpdateRequest(BaseModel):
    name: Optional[str] = None
    frequency: Optional[str] = None
    pay_day_of_week: Optional[int] = None
    pay_day_1: Optional[int] = None
    pay_day_2: Optional[int] = None
    first_pay_date: Optional[date] = None
    first_period_start: Optional[date] = None
    first_period_end: Optional[date] = None
    holiday_shift: Optional[bool] = None
    weekend_shift: Optional[bool] = None
    auto_run_enabled: Optional[bool] = None
    auto_run_days_before: Optional[int] = None
    is_default: Optional[bool] = None
    color: Optional[str] = None


class PayScheduleResponse(BaseModel):
    id: str
    name: str
    frequency: str
    periods_per_year: int
    pay_day_of_week: Optional[int] = None
    pay_day_1: Optional[int] = None
    pay_day_2: Optional[int] = None
    first_pay_date: date
    first_period_start: date
    first_period_end: date
    next_pay_date: Optional[date] = None
    next_period_start: Optional[date] = None
    next_period_end: Optional[date] = None
    holiday_shift: bool
    weekend_shift: bool
    auto_run_enabled: bool
    auto_run_days_before: int
    is_default: bool
    is_paused: bool
    color: str
    employee_count: int = 0
    is_due: bool = False


def _schedule_to_response(schedule: PaySchedule, employee_count: int = 0) -> PayScheduleResponse:
    today = date.today()
    upcoming = upcoming_pay_dates(schedule, count=1, from_date=today)
    next_pd = upcoming[0] if upcoming else None

    return PayScheduleResponse(
        id=str(schedule.id),
        name=schedule.name,
        frequency=schedule.frequency,
        periods_per_year=periods_per_year_for_schedule(schedule),
        pay_day_of_week=schedule.pay_day_of_week,
        pay_day_1=schedule.pay_day_1,
        pay_day_2=schedule.pay_day_2,
        first_pay_date=schedule.first_pay_date,
        first_period_start=schedule.first_period_start,
        first_period_end=schedule.first_period_end,
        next_pay_date=next_pd["pay_date"] if next_pd else None,
        next_period_start=next_pd["period_start"] if next_pd else None,
        next_period_end=next_pd["period_end"] if next_pd else None,
        holiday_shift=schedule.holiday_shift,
        weekend_shift=schedule.weekend_shift,
        auto_run_enabled=schedule.auto_run_enabled,
        auto_run_days_before=schedule.auto_run_days_before,
        is_default=schedule.is_default,
        is_paused=schedule.is_paused,
        color=schedule.color,
        employee_count=employee_count,
        is_due=is_schedule_due(schedule, today),
    )


@router.post("/schedules", response_model=PayScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    body: PayScheduleCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.is_default:
        await db.execute(
            update(PaySchedule)
            .where(PaySchedule.owner_id == current_user.id, PaySchedule.is_default.is_(True))
            .values(is_default=False)
        )

    schedule = PaySchedule(
        owner_id=current_user.id,
        name=body.name,
        frequency=body.frequency,
        pay_day_of_week=body.pay_day_of_week,
        pay_day_1=body.pay_day_1,
        pay_day_2=body.pay_day_2,
        first_pay_date=body.first_pay_date,
        first_period_start=body.first_period_start,
        first_period_end=body.first_period_end,
        holiday_shift=body.holiday_shift,
        weekend_shift=body.weekend_shift,
        auto_run_enabled=body.auto_run_enabled,
        auto_run_days_before=body.auto_run_days_before,
        is_default=body.is_default,
        color=body.color,
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return _schedule_to_response(schedule, employee_count=0)


@router.get("/schedules", response_model=List[PayScheduleResponse])
async def list_schedules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PaySchedule).where(PaySchedule.owner_id == current_user.id)
        .order_by(PaySchedule.is_default.desc(), PaySchedule.created_at.asc())
    )
    schedules = result.scalars().all()

    responses = []
    for s in schedules:
        count_result = await db.execute(
            select(func.count(Employee.id)).where(Employee.pay_schedule_id == s.id)
        )
        emp_count = count_result.scalar() or 0
        responses.append(_schedule_to_response(s, employee_count=emp_count))

    return responses


@router.get("/schedules/due", response_model=List[PayScheduleResponse])
async def list_due_schedules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List schedules that currently have a pay run due."""
    result = await db.execute(
        select(PaySchedule).where(
            PaySchedule.owner_id == current_user.id,
            PaySchedule.is_paused.is_(False),
        )
    )
    schedules = result.scalars().all()

    today = date.today()
    responses = []
    for s in schedules:
        if is_schedule_due(s, today):
            count_result = await db.execute(
                select(func.count(Employee.id)).where(Employee.pay_schedule_id == s.id)
            )
            emp_count = count_result.scalar() or 0
            responses.append(_schedule_to_response(s, employee_count=emp_count))

    return responses


@router.get("/schedules/{schedule_id}", response_model=PayScheduleResponse)
async def get_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PaySchedule).where(
            PaySchedule.id == schedule_id, PaySchedule.owner_id == current_user.id
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    count_result = await db.execute(
        select(func.count(Employee.id)).where(Employee.pay_schedule_id == schedule.id)
    )
    emp_count = count_result.scalar() or 0
    return _schedule_to_response(schedule, employee_count=emp_count)


@router.patch("/schedules/{schedule_id}", response_model=PayScheduleResponse)
async def update_schedule(
    schedule_id: UUID,
    body: PayScheduleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PaySchedule).where(
            PaySchedule.id == schedule_id, PaySchedule.owner_id == current_user.id
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    updates = body.dict(exclude_unset=True)

    if updates.get("is_default") is True:
        await db.execute(
            update(PaySchedule)
            .where(
                PaySchedule.owner_id == current_user.id,
                PaySchedule.is_default.is_(True),
                PaySchedule.id != schedule.id,
            )
            .values(is_default=False)
        )

    for key, value in updates.items():
        setattr(schedule, key, value)

    await db.commit()
    await db.refresh(schedule)

    count_result = await db.execute(
        select(func.count(Employee.id)).where(Employee.pay_schedule_id == schedule.id)
    )
    emp_count = count_result.scalar() or 0
    return _schedule_to_response(schedule, employee_count=emp_count)


@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PaySchedule).where(
            PaySchedule.id == schedule_id, PaySchedule.owner_id == current_user.id
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    count_result = await db.execute(
        select(func.count(Employee.id)).where(Employee.pay_schedule_id == schedule.id)
    )
    emp_count = count_result.scalar() or 0
    if emp_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete schedule with {emp_count} employees assigned. Move them to another schedule first."
        )

    await db.delete(schedule)
    await db.commit()
    return None


@router.post("/schedules/{schedule_id}/duplicate", response_model=PayScheduleResponse)
async def duplicate_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PaySchedule).where(
            PaySchedule.id == schedule_id, PaySchedule.owner_id == current_user.id
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    copy = PaySchedule(
        owner_id=schedule.owner_id,
        name=f"{schedule.name} (Copy)",
        frequency=schedule.frequency,
        pay_day_of_week=schedule.pay_day_of_week,
        pay_day_1=schedule.pay_day_1,
        pay_day_2=schedule.pay_day_2,
        first_pay_date=schedule.first_pay_date,
        first_period_start=schedule.first_period_start,
        first_period_end=schedule.first_period_end,
        holiday_shift=schedule.holiday_shift,
        weekend_shift=schedule.weekend_shift,
        auto_run_enabled=False,
        auto_run_days_before=schedule.auto_run_days_before,
        is_default=False,
        color=schedule.color,
    )
    db.add(copy)
    await db.commit()
    await db.refresh(copy)
    return _schedule_to_response(copy, employee_count=0)


@router.post("/schedules/{schedule_id}/pause", response_model=PayScheduleResponse)
async def pause_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PaySchedule).where(
            PaySchedule.id == schedule_id, PaySchedule.owner_id == current_user.id
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    schedule.is_paused = True
    await db.commit()
    await db.refresh(schedule)

    count_result = await db.execute(
        select(func.count(Employee.id)).where(Employee.pay_schedule_id == schedule.id)
    )
    emp_count = count_result.scalar() or 0
    return _schedule_to_response(schedule, employee_count=emp_count)


@router.post("/schedules/{schedule_id}/resume", response_model=PayScheduleResponse)
async def resume_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PaySchedule).where(
            PaySchedule.id == schedule_id, PaySchedule.owner_id == current_user.id
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    schedule.is_paused = False
    await db.commit()
    await db.refresh(schedule)

    count_result = await db.execute(
        select(func.count(Employee.id)).where(Employee.pay_schedule_id == schedule.id)
    )
    emp_count = count_result.scalar() or 0
    return _schedule_to_response(schedule, employee_count=emp_count)


@router.get("/schedules/{schedule_id}/upcoming")
async def get_upcoming_dates(
    schedule_id: UUID,
    count: int = 6,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PaySchedule).where(
            PaySchedule.id == schedule_id, PaySchedule.owner_id == current_user.id
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    return {"upcoming": upcoming_pay_dates(schedule, count=count)}


@router.get("/schedules/{schedule_id}/employees")
async def get_schedule_employees(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PaySchedule).where(
            PaySchedule.id == schedule_id, PaySchedule.owner_id == current_user.id
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    emp_result = await db.execute(
        select(Employee).where(Employee.pay_schedule_id == schedule_id)
    )
    employees = emp_result.scalars().all()

    return {
        "schedule_id": str(schedule_id),
        "employees": [
            {"id": str(e.id), "first_name": e.first_name, "last_name": e.last_name}
            for e in employees
        ],
    }