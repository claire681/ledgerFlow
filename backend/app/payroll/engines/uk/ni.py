"""UK National Insurance Contributions (Category A), 2026/27.

Reference: HMRC NIC rates and thresholds.

Category A covers the standard adult employee (about 95 percent of UK workers).
Other categories (B, C, H, J, M, V, X, Z) have different rates and will be
added in future modules.

2025/26 figures (placeholders for 2026/27; verify against HMRC publication):
- Lower Earnings Limit (LEL):     6,500/year   (125/week)
- Primary Threshold (PT):        12,570/year   (242/week)
- Upper Earnings Limit (UEL):    50,270/year   (967/week)
- Secondary Threshold (ST):       5,000/year    (96/week, since April 2025)

Employee rates (Category A):
- 0 percent below PT
- 8 percent between PT and UEL (cut from 12 percent in April 2024)
- 2 percent above UEL

Employer rate:
- 15 percent above ST (raised from 13.8 percent in April 2025)

Pure function. NI is non-cumulative (period-only), unlike PAYE.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple


# 2026/27 thresholds (annual) - placeholder values
PT_ANNUAL = Decimal("12570.00")
UEL_ANNUAL = Decimal("50270.00")
ST_ANNUAL = Decimal("5000.00")

# Category A rates
NI_EMPLOYEE_MAIN_RATE = Decimal("0.08")
NI_EMPLOYEE_ADDITIONAL_RATE = Decimal("0.02")
NI_EMPLOYER_RATE = Decimal("0.15")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_ni_category_a(
    gross_pay: Decimal,
    pay_periods_per_year: int,
) -> Tuple[Decimal, Decimal]:
    """Calculate NI Category A for one pay period.

    Args:
        gross_pay: NIable earnings this period.
        pay_periods_per_year: 12 (monthly), 13 (4-weekly), 26 (biweekly), 52 (weekly).

    Returns:
        (ni_employee, ni_employer)
    """
    # Per-period thresholds
    pt = PT_ANNUAL / Decimal(pay_periods_per_year)
    uel = UEL_ANNUAL / Decimal(pay_periods_per_year)
    st = ST_ANNUAL / Decimal(pay_periods_per_year)

    # Employee NI (main band + additional band)
    ni_employee = Decimal("0")
    if gross_pay > pt:
        main_band = min(gross_pay, uel) - pt
        ni_employee += main_band * NI_EMPLOYEE_MAIN_RATE
        if gross_pay > uel:
            additional_band = gross_pay - uel
            ni_employee += additional_band * NI_EMPLOYEE_ADDITIONAL_RATE

    # Employer NI (above secondary threshold)
    ni_employer = Decimal("0")
    if gross_pay > st:
        ni_employer = (gross_pay - st) * NI_EMPLOYER_RATE

    return (_q(ni_employee), _q(ni_employer))
