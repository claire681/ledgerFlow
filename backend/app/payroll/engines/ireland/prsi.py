"""Irish PRSI (Pay Related Social Insurance), 2026.

Reference: Revenue.ie / Department of Social Protection PRSI rates.

Class A1 covers the vast majority of private-sector employees.

2025 figures (placeholder for 2026; rates trended up):
- Employee Class A1: 4.1 percent of weekly earnings (no employee threshold)
  (increased from 4.0 percent October 2024)
- Employer Class A1:
    8.9 percent if weekly pay <= 441 (annualized 22,932)
   11.15 percent above

For v1: Class A1 only. Other classes (J, S, etc.) handled separately later.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple


PRSI_EMPLOYEE_RATE = Decimal("0.041")
PRSI_EMPLOYER_RATE_LOW = Decimal("0.089")
PRSI_EMPLOYER_RATE_HIGH = Decimal("0.1115")
PRSI_EMPLOYER_THRESHOLD_ANNUAL = Decimal("22932.00")  # ~441/week


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_prsi(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    class_code: str = "A1",
) -> Tuple[Decimal, Decimal]:
    """Calculate PRSI for one pay period (Class A1 only in v1)."""
    if class_code != "A1":
        class_code = "A1"  # fallback

    employee = _q(gross_pay * PRSI_EMPLOYEE_RATE)

    annual_gross = gross_pay * Decimal(pay_periods_per_year)
    if annual_gross > PRSI_EMPLOYER_THRESHOLD_ANNUAL:
        employer = _q(gross_pay * PRSI_EMPLOYER_RATE_HIGH)
    else:
        employer = _q(gross_pay * PRSI_EMPLOYER_RATE_LOW)

    return (employee, employer)
