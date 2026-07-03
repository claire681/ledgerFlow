"""Employment Insurance (EI) calculation for Canada, 2026.

Reference: Canada Employment Insurance Commission, 2026 rates.

2026 figures (placeholder until final EI publication; verify before production):
- Employee rate (federal): 1.66 percent
- Employer rate: 1.4 x employee = 2.324 percent
- Maximum Insurable Earnings: 65,700

Quebec uses a lower EI rate (1.32 percent employee) plus QPIP separately;
this module returns the standard federal rate for now. Quebec handling
goes in a separate qpip.py module.

Pure function. No I/O, no DB, deterministic.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple, Optional


# 2026 constants. Verify before production.
EI_RATE_EMPLOYEE_2026 = Decimal("0.0166")
EI_EMPLOYER_MULTIPLIER = Decimal("1.40")
MAX_INSURABLE_EARNINGS_2026 = Decimal("65700.00")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_ei(
    gross_pay: Decimal,
    ytd_insurable_earnings: Decimal,
    ei_exempt: bool = False,
    province: Optional[str] = None,
) -> Tuple[Decimal, Decimal, Decimal]:
    """Calculate EI for one pay period.

    Args:
        gross_pay: Insurable earnings this period.
        ytd_insurable_earnings: YTD insurable earnings BEFORE this period.
        ei_exempt: Some workers (e.g. self-incorporated owners) are exempt.
        province: Reserved for future QC handling.

    Returns:
        (ei_employee, ei_employer, new_ytd_insurable_earnings)
    """
    if ei_exempt:
        return (Decimal("0"), Decimal("0"), ytd_insurable_earnings)

    # Cap insurable earnings at MIE
    period_insurable = gross_pay
    if ytd_insurable_earnings + period_insurable > MAX_INSURABLE_EARNINGS_2026:
        period_insurable = max(
            MAX_INSURABLE_EARNINGS_2026 - ytd_insurable_earnings, Decimal("0")
        )

    new_ytd = ytd_insurable_earnings + period_insurable

    ei_employee = _q(period_insurable * EI_RATE_EMPLOYEE_2026)
    ei_employer = _q(ei_employee * EI_EMPLOYER_MULTIPLIER)

    return (ei_employee, ei_employer, new_ytd)
