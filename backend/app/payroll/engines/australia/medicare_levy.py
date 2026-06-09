"""Australian Medicare Levy, 2026-27.

Reference: ATO Medicare Levy thresholds.

Standard rate: 2 percent of taxable income.

Thresholds (2024-25, projecting to 2026-27):
- Full exemption below 27,222 (individual)
- Phased in from 27,222 to 34,027
- Full 2 percent above 34,027

For v1: simplified to full 2 percent above 34,027.
Phase-in calculation and family thresholds added in v2.
Medicare Levy Surcharge (additional 1-1.5 percent for high earners without
private health insurance) is separate and not handled here.
"""

from decimal import Decimal, ROUND_HALF_UP


MEDICARE_LEVY_RATE = Decimal("0.02")
LEVY_THRESHOLD_ANNUAL = Decimal("34027.00")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_medicare_levy(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    exempt: bool = False,
) -> Decimal:
    """Calculate Medicare Levy for one pay period (simplified, no phase-in).

    Args:
        gross_pay: Taxable earnings this period.
        pay_periods_per_year: 12, 26, 52.
        exempt: Some residents are exempt (foreign residents, certain visa holders).
    """
    if exempt:
        return Decimal("0")

    annual_gross = gross_pay * Decimal(pay_periods_per_year)
    if annual_gross < LEVY_THRESHOLD_ANNUAL:
        return Decimal("0")

    annual_levy = annual_gross * MEDICARE_LEVY_RATE
    return _q(annual_levy / Decimal(pay_periods_per_year))
