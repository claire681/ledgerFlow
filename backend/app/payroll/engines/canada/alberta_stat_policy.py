"""Alberta ESA stat holiday policy router.

Applies Path A/B/C/D logic per employee and returns the correct
stat_pay_amount + stat_holiday_hours_at_premium + stat_holiday_hours_at_regular
values to pass to the engine.

The engine does no policy routing itself - just math.

Paths per Alberta Employment Standards:
- Path A: regular workday + didn't work    -> pay ADW (flat)
- Path B: regular workday + worked
   - Option 1 (default): 1.5x hours worked + ADW
   - Option 2: 1.0x hours worked + future day off with ADW
- Path C: not regular workday + didn't work -> $0 (no entitlement)
- Path D: not regular workday + worked      -> 1.5x hours worked only
"""

from datetime import date
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.payroll.types import PayRunEmployeeInput
from app.payroll.engines.canada.alberta_holidays import get_holidays_in_range
from app.payroll.engines.canada.adw_calculator import (
    compute_average_daily_wage,
    is_regular_workday,
)


async def apply_alberta_stat_holiday_policy(
    db: AsyncSession,
    employee_inputs: List[PayRunEmployeeInput],
    employees_by_id: Dict[str, Dict[str, Any]],
    pay_period_start: date,
    pay_period_end: date,
    stat_holiday_option: int = 1,
) -> List[PayRunEmployeeInput]:
    """Return a new list of employee inputs with Alberta stat pay values applied.

    Args:
        db: DB session (for ADW lookups)
        employee_inputs: raw inputs from API request
        employees_by_id: dict of employee data (must include weekly_schedule)
        pay_period_start: start of the pay period being calculated
        pay_period_end: end of the pay period
        stat_holiday_option: 1 = time-and-a-half + ADW (default),
                             2 = regular pay + day in lieu (future day off)

    Returns:
        Updated employee inputs with correct stat_pay_amount + hour splits.
    """
    holidays = get_holidays_in_range(pay_period_start, pay_period_end)

    # No Alberta holidays in this period -> zero out any stat pay
    if not holidays:
        return [
            _clear_stat_fields(inp) for inp in employee_inputs
        ]

    result = []
    for inp in employee_inputs:
        emp = employees_by_id.get(str(inp.employee_id))
        if not emp:
            # Employee not found - pass through unchanged
            result.append(inp)
            continue

        # Skip salaried employees per Alberta ESA salaried simplification
        pay_type = (emp.get("pay_type") or "hourly").lower()
        if pay_type == "salary":
            result.append(_clear_stat_fields(inp))
            continue

        weekly_schedule = emp.get("weekly_schedule") or {}
        hours_worked_on_holidays = Decimal(str(inp.hours.stat_holiday or 0))

        # Accumulate values across all holidays in the period
        total_flat_adw = Decimal("0")
        total_premium_hours = Decimal("0")
        total_regular_hours = Decimal("0")

        # For each holiday, determine path
        for h_date, _h_name in holidays:
            is_regular = is_regular_workday(weekly_schedule, h_date)

            # For MVP: assume any stat_holiday hours entered by user apply
            # proportionally to each holiday. If multiple holidays, split evenly.
            hours_per_holiday = (
                hours_worked_on_holidays / Decimal(len(holidays))
                if len(holidays) > 0
                else Decimal("0")
            )
            worked_this_holiday = hours_per_holiday > 0

            # Compute ADW for this employee at this holiday date
            adw = await compute_average_daily_wage(
                db, str(inp.employee_id), h_date
            )

            if is_regular and not worked_this_holiday:
                # Path A: regular workday + didn't work -> ADW only
                total_flat_adw += adw

            elif is_regular and worked_this_holiday:
                if stat_holiday_option == 2:
                    # Path B Option 2: regular pay + day in lieu (deferred)
                    total_regular_hours += hours_per_holiday
                    # Day in lieu tracked separately - not paid this run
                else:
                    # Path B Option 1 (default): 1.5x hours + ADW
                    total_premium_hours += hours_per_holiday
                    total_flat_adw += adw

            elif not is_regular and not worked_this_holiday:
                # Path C: not regular + didn't work -> $0
                pass

            else:
                # Path D: not regular + worked -> 1.5x hours only
                total_premium_hours += hours_per_holiday

        # Create new input with computed values
        updated = inp.model_copy(
            update={
                "stat_pay_amount": total_flat_adw.quantize(Decimal("0.01")),
                "stat_holiday_hours_at_premium": total_premium_hours.quantize(
                    Decimal("0.01")
                ),
                "stat_holiday_hours_at_regular": total_regular_hours.quantize(
                    Decimal("0.01")
                ),
            }
        )
        result.append(updated)

    return result


def _clear_stat_fields(inp: PayRunEmployeeInput) -> PayRunEmployeeInput:
    """Return input with stat pay fields set to zero."""
    return inp.model_copy(
        update={
            "stat_pay_amount": Decimal("0"),
            "stat_holiday_hours_at_premium": Decimal("0"),
            "stat_holiday_hours_at_regular": Decimal("0"),
        }
    )