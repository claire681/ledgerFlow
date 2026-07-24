"""Pay schedule date computation helpers.

Handles:
- Computing next N pay dates for a schedule
- Deriving period start/end from pay date
- Weekend + holiday shifting (Canadian federal holidays)
- Detecting which schedules are currently due
"""
from datetime import date, timedelta
from calendar import monthrange
from typing import List, Optional, Tuple


CA_FEDERAL_HOLIDAYS_2026 = [
    date(2026, 1, 1),   # New Year's Day
    date(2026, 4, 3),   # Good Friday
    date(2026, 5, 18),  # Victoria Day (Monday before May 25)
    date(2026, 7, 1),   # Canada Day
    date(2026, 9, 7),   # Labour Day
    date(2026, 9, 30),  # National Day for Truth and Reconciliation
    date(2026, 10, 12), # Thanksgiving (2nd Monday of October)
    date(2026, 11, 11), # Remembrance Day
    date(2026, 12, 25), # Christmas
    date(2026, 12, 28), # Boxing Day observed (Dec 26 is Saturday)
]


def _is_weekend(d: date) -> bool:
    return d.weekday() >= 5


def _is_holiday(d: date) -> bool:
    return d in CA_FEDERAL_HOLIDAYS_2026


def _shift_to_prior_business_day(d: date) -> date:
    while _is_weekend(d) or _is_holiday(d):
        d = d - timedelta(days=1)
    return d


def _apply_shifts(d: date, weekend_shift: bool, holiday_shift: bool) -> date:
    if weekend_shift and _is_weekend(d):
        d = _shift_to_prior_business_day(d)
    elif holiday_shift and _is_holiday(d):
        d = _shift_to_prior_business_day(d)
    return d


def compute_period_for_pay_date(schedule, pay_date: date) -> Tuple[date, date]:
    """Given a pay date, compute the pay period start and end.
    
    Convention: pay period ends 1-2 days before pay date.
    Returns (period_start, period_end).
    """
    freq = (schedule.frequency or "").lower().replace("-", "").replace("_", "").replace(" ", "")

    if freq == "weekly":
        period_end = pay_date - timedelta(days=1)
        period_start = period_end - timedelta(days=6)
        return period_start, period_end

    if freq == "biweekly":
        period_end = pay_date - timedelta(days=1)
        period_start = period_end - timedelta(days=13)
        return period_start, period_end

    if freq == "semimonthly":
        day1 = schedule.pay_day_1 or 15
        if pay_date.day <= day1 or pay_date.day <= 15:
            period_start = date(pay_date.year, pay_date.month, 1)
            period_end = date(pay_date.year, pay_date.month, min(day1, 15))
        else:
            last_day = monthrange(pay_date.year, pay_date.month)[1]
            period_start = date(pay_date.year, pay_date.month, min(day1, 15) + 1)
            period_end = date(pay_date.year, pay_date.month, last_day)
        return period_start, period_end

    if freq == "monthly":
        last_day = monthrange(pay_date.year, pay_date.month)[1]
        period_start = date(pay_date.year, pay_date.month, 1)
        period_end = date(pay_date.year, pay_date.month, last_day)
        return period_start, period_end

    if freq == "4week":
        period_end = pay_date - timedelta(days=1)
        period_start = period_end - timedelta(days=27)
        return period_start, period_end

    return schedule.first_period_start, schedule.first_period_end


def next_pay_date(schedule, from_date: date) -> date:
    """Compute next pay date on or after from_date."""
    freq = (schedule.frequency or "").lower().replace("-", "").replace("_", "").replace(" ", "")
    anchor = schedule.first_pay_date

    if freq == "weekly":
        days_since_anchor = (from_date - anchor).days
        if days_since_anchor < 0:
            return _apply_shifts(anchor, schedule.weekend_shift, schedule.holiday_shift)
        weeks_ahead = (days_since_anchor // 7) + (1 if days_since_anchor % 7 else 0)
        d = anchor + timedelta(weeks=weeks_ahead)

    elif freq == "biweekly":
        days_since_anchor = (from_date - anchor).days
        if days_since_anchor < 0:
            d = anchor
        else:
            periods_ahead = (days_since_anchor // 14) + (1 if days_since_anchor % 14 else 0)
            d = anchor + timedelta(weeks=periods_ahead * 2)

    elif freq == "semimonthly":
        # If anchor is in the future or today, use it as the next pay date.
        # This handles initial runs AND user overrides for future dates.
        if anchor and anchor >= from_date:
            d = anchor
            return _apply_shifts(d, schedule.weekend_shift, schedule.holiday_shift)

        # Otherwise, roll forward from from_date using pay_day_1 / pay_day_2.
        day1 = schedule.pay_day_1 or 15
        day2 = schedule.pay_day_2 or 31
        candidates = []
        for month_offset in range(0, 3):
            y = from_date.year
            m = from_date.month + month_offset
            while m > 12:
                m -= 12
                y += 1
            last = monthrange(y, m)[1]
            d1 = date(y, m, min(day1, last))
            d2 = date(y, m, min(day2, last))
            candidates.extend([d1, d2])
        d = min([c for c in candidates if c >= from_date], default=candidates[-1])

    elif freq == "monthly":
        target_day = anchor.day
        y, m = from_date.year, from_date.month
        last = monthrange(y, m)[1]
        candidate = date(y, m, min(target_day, last))
        if candidate < from_date:
            m += 1
            if m > 12:
                m = 1
                y += 1
            last = monthrange(y, m)[1]
            candidate = date(y, m, min(target_day, last))
        d = candidate

    elif freq == "4week":
        days_since_anchor = (from_date - anchor).days
        if days_since_anchor < 0:
            d = anchor
        else:
            periods_ahead = (days_since_anchor // 28) + (1 if days_since_anchor % 28 else 0)
            d = anchor + timedelta(days=periods_ahead * 28)
    else:
        d = anchor

    return _apply_shifts(d, schedule.weekend_shift, schedule.holiday_shift)


def upcoming_pay_dates(schedule, count: int = 6, from_date: Optional[date] = None) -> List[dict]:
    """Return next N pay dates with their periods."""
    if from_date is None:
        from_date = date.today()

    results = []
    current = from_date
    for _ in range(count):
        pd = next_pay_date(schedule, current)
        ps, pe = compute_period_for_pay_date(schedule, pd)
        results.append({
            "pay_date": pd,
            "period_start": ps,
            "period_end": pe,
        })
        current = pd + timedelta(days=1)

    return results


def is_schedule_due(schedule, today: Optional[date] = None) -> bool:
    """Is a pay run currently due for this schedule?"""
    if today is None:
        today = date.today()
    if schedule.is_paused:
        return False

    upcoming = upcoming_pay_dates(schedule, count=1, from_date=today)
    if not upcoming:
        return False

    next_pd = upcoming[0]["pay_date"]
    days_until = (next_pd - today).days
    return days_until <= schedule.auto_run_days_before


PAY_PERIODS_PER_YEAR = {
    "weekly": 52,
    "biweekly": 26,
    "semimonthly": 24,
    "monthly": 12,
    "4week": 13,
}


def periods_per_year_for_schedule(schedule) -> int:
    """Get pay_periods_per_year for a schedule."""
    freq = (schedule.frequency or "").lower().replace("-", "").replace("_", "").replace(" ", "")
    return PAY_PERIODS_PER_YEAR.get(freq, 26)