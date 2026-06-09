"""US FUTA - Federal Unemployment Tax, 2026.

Reference: IRS Publication 15.

Employer-only tax. Statutory rate 6.0 percent on first 7,000 of wages.
Most employers receive full state credit reducing effective rate to 0.6 percent.

For v1: use effective 0.6 percent. Credit-reduction states (rare, recalculated
annually by IRS) handled separately when relevant.
"""

from decimal import Decimal, ROUND_HALF_UP


FUTA_WAGE_BASE = Decimal("7000.00")
FUTA_EFFECTIVE_RATE = Decimal("0.006")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_futa(
    gross_pay: Decimal,
    ytd_futa_wages: Decimal,
) -> tuple:
    """Calculate FUTA for one pay period.

    Returns (futa_amount, new_ytd_futa_wages).
    """
    period_wages = gross_pay
    if ytd_futa_wages + period_wages > FUTA_WAGE_BASE:
        period_wages = max(FUTA_WAGE_BASE - ytd_futa_wages, Decimal("0"))

    futa = _q(period_wages * FUTA_EFFECTIVE_RATE)
    new_ytd = ytd_futa_wages + period_wages
    return (futa, new_ytd)
