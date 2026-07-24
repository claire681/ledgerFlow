"""Alberta ESA Average Daily Wage (ADW) calculator.

Per Alberta ESA, ADW = (wages earned in 4 weeks before holiday) / (days worked).
Overtime pay is excluded from wages.

For MVP without clock-level data, we approximate 'days worked' as:
  (total non-overtime hours in period) / 8

Once Workforce clock data is available, we can compute exactly from clock events.

Falls back to hourly_rate * 8 if the employee has no pay history yet.
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import PayStub, PayRun, Employee


# Alberta ESA period options - both are valid, we use Option 1 (simpler)
# Option 1: 4 weeks immediately preceding the holiday date
# Option 2: 4 weeks ending on the last day of the pay period preceding the holiday
DEFAULT_LOOKBACK_DAYS = 28  # 4 weeks


async def compute_average_daily_wage(
    db: AsyncSession,
    employee_id: str,
    holiday_date: date,
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
) -> Decimal:
    """Compute Alberta ESA Average Daily Wage for an employee.

    Args:
        db: async DB session
        employee_id: employee UUID as string
        holiday_date: the general holiday date we're calculating for
        lookback_days: days to look back (default 28 = 4 weeks)

    Returns:
        Decimal ADW value. Zero if not eligible or no history.
    """
    period_end = holiday_date - timedelta(days=1)  # day before holiday
    period_start = period_end - timedelta(days=lookback_days - 1)

    # Query pay stubs in this window (via pay_run.pay_date)
    stmt = (
        select(PayStub, PayRun)
        .join(PayRun, PayStub.pay_run_id == PayRun.id)
        .where(
            and_(
                PayStub.employee_id == employee_id,
                PayRun.pay_date >= period_start,
                PayRun.pay_date <= period_end,
                PayRun.status.in_(("finalized", "draft")),
            )
        )
    )
    result = await db.execute(stmt)
    rows = result.all()

    total_hours = Decimal("0")
    total_wages = Decimal("0")

    for stub, _run in rows:
        # Non-overtime hours worked (per Alberta ESA overtime is excluded)
        worked_hours = (
            (stub.hours_regular or Decimal("0"))
            + (stub.hours_stat_holiday or Decimal("0"))
            + (stub.hours_evening or Decimal("0"))
            + (stub.hours_overnight or Decimal("0"))
            + (stub.hours_weekend or Decimal("0"))
            + (stub.hours_on_call or Decimal("0"))
            + (stub.hours_travel or Decimal("0"))
        )
        rate = stub.hourly_rate or Decimal("0")
        total_hours += worked_hours
        total_wages += worked_hours * rate

    if total_hours <= 0:
        # No history: fall back to hourly_rate * 8 if we can look up rate
        emp_result = await db.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        emp = emp_result.scalar_one_or_none()
        if emp and emp.hourly_rate:
            return (Decimal(str(emp.hourly_rate)) * Decimal("8")).quantize(Decimal("0.01"))
        return Decimal("0")

    # Approximation: days worked = hours / 8 (8-hour standard workday)
    # Will be replaced by exact count from Workforce clock data in later phase
    estimated_days = total_hours / Decimal("8")

    if estimated_days <= 0:
        return Decimal("0")

    adw = (total_wages / estimated_days).quantize(Decimal("0.01"))
    return adw


def is_regular_workday(weekly_schedule: dict, target_date: date) -> bool:
    """Check if target_date is a regular workday for the employee based on
    their weekly_schedule JSON.

    weekly_schedule: {"mon": true, "tue": true, ...}
    target_date: the date to check

    Returns True if the employee normally works on that day of the week.
    """
    if not weekly_schedule or not isinstance(weekly_schedule, dict):
        # Missing schedule: assume every day is a regular workday (safest default)
        return True
    day_names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    day_key = day_names[target_date.weekday()]
    return bool(weekly_schedule.get(day_key, True))