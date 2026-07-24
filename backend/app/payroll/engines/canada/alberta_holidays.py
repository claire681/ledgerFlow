"""Alberta general holidays per Employment Standards Code.

The 9 mandatory general holidays in Alberta (2025-2030).
Source: alberta.ca/general-holidays-pay

Rules:
- Applies to all employees who worked 30+ workdays in past 12 months
- Employer may also recognize optional holidays; those aren't in this list
- Full-time, part-time, and casual employees are treated the same
"""

from datetime import date
from typing import Optional


# 9 general holidays in Alberta, hardcoded by year.
# Sources: Alberta Employment Standards, published dates.
ALBERTA_HOLIDAYS = {
    2025: [
        (date(2025, 1, 1), "New Year's Day"),
        (date(2025, 2, 17), "Alberta Family Day"),
        (date(2025, 4, 18), "Good Friday"),
        (date(2025, 5, 19), "Victoria Day"),
        (date(2025, 7, 1), "Canada Day"),
        (date(2025, 9, 1), "Labour Day"),
        (date(2025, 10, 13), "Thanksgiving Day"),
        (date(2025, 11, 11), "Remembrance Day"),
        (date(2025, 12, 25), "Christmas Day"),
    ],
    2026: [
        (date(2026, 1, 1), "New Year's Day"),
        (date(2026, 2, 16), "Alberta Family Day"),
        (date(2026, 4, 3), "Good Friday"),
        (date(2026, 5, 18), "Victoria Day"),
        (date(2026, 7, 1), "Canada Day"),
        (date(2026, 9, 7), "Labour Day"),
        (date(2026, 10, 12), "Thanksgiving Day"),
        (date(2026, 11, 11), "Remembrance Day"),
        (date(2026, 12, 25), "Christmas Day"),
    ],
    2027: [
        (date(2027, 1, 1), "New Year's Day"),
        (date(2027, 2, 15), "Alberta Family Day"),
        (date(2027, 3, 26), "Good Friday"),
        (date(2027, 5, 24), "Victoria Day"),
        (date(2027, 7, 1), "Canada Day"),
        (date(2027, 9, 6), "Labour Day"),
        (date(2027, 10, 11), "Thanksgiving Day"),
        (date(2027, 11, 11), "Remembrance Day"),
        (date(2027, 12, 25), "Christmas Day"),
    ],
    2028: [
        (date(2028, 1, 1), "New Year's Day"),
        (date(2028, 2, 21), "Alberta Family Day"),
        (date(2028, 4, 14), "Good Friday"),
        (date(2028, 5, 22), "Victoria Day"),
        (date(2028, 7, 1), "Canada Day"),
        (date(2028, 9, 4), "Labour Day"),
        (date(2028, 10, 9), "Thanksgiving Day"),
        (date(2028, 11, 11), "Remembrance Day"),
        (date(2028, 12, 25), "Christmas Day"),
    ],
    2029: [
        (date(2029, 1, 1), "New Year's Day"),
        (date(2029, 2, 19), "Alberta Family Day"),
        (date(2029, 3, 30), "Good Friday"),
        (date(2029, 5, 21), "Victoria Day"),
        (date(2029, 7, 2), "Canada Day"),  # falls on Sunday in 2029
        (date(2029, 9, 3), "Labour Day"),
        (date(2029, 10, 8), "Thanksgiving Day"),
        (date(2029, 11, 11), "Remembrance Day"),
        (date(2029, 12, 25), "Christmas Day"),
    ],
    2030: [
        (date(2030, 1, 1), "New Year's Day"),
        (date(2030, 2, 18), "Alberta Family Day"),
        (date(2030, 4, 19), "Good Friday"),
        (date(2030, 5, 20), "Victoria Day"),
        (date(2030, 7, 1), "Canada Day"),
        (date(2030, 9, 2), "Labour Day"),
        (date(2030, 10, 14), "Thanksgiving Day"),
        (date(2030, 11, 11), "Remembrance Day"),
        (date(2030, 12, 25), "Christmas Day"),
    ],
}


def get_holidays_in_range(start: date, end: date):
    """Return list of (date, name) tuples for Alberta general holidays
    falling within [start, end] inclusive."""
    result = []
    for year in range(start.year, end.year + 1):
        for h_date, h_name in ALBERTA_HOLIDAYS.get(year, []):
            if start <= h_date <= end:
                result.append((h_date, h_name))
    return result


def is_holiday(d: date) -> Optional[str]:
    """Return holiday name if d is an Alberta general holiday, else None."""
    year_holidays = ALBERTA_HOLIDAYS.get(d.year, [])
    for h_date, h_name in year_holidays:
        if h_date == d:
            return h_name
    return None