"""Texas (and 8 other states) state income tax: NONE.

States with no income tax: AK, FL, NV, NH, SD, TN, TX, WA, WY.
This module returns zero and is used as the handler for all of them.
"""

from decimal import Decimal


def calculate_texas_tax(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    **kwargs,
) -> Decimal:
    """No state income tax."""
    return Decimal("0")
