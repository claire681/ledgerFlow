"""Illinois state income tax, 2026.

Flat 4.95 percent.
Personal exemption: 2,775 (2024; placeholder for 2026).
"""

from decimal import Decimal, ROUND_HALF_UP


IL_RATE = Decimal("0.0495")
IL_PERSONAL_EXEMPTION = Decimal("2775.00")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_illinois_tax(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    allowances: int = 1,
    **kwargs,
) -> Decimal:
    """Illinois flat-rate income tax for one pay period.

    Args:
        allowances: IL-W-4 line 1 + line 2 (default 1 = self only).
    """
    annual_gross = gross_pay * Decimal(pay_periods_per_year)
    annual_exemption = Decimal(allowances) * IL_PERSONAL_EXEMPTION
    annual_taxable = max(annual_gross - annual_exemption, Decimal("0"))
    annual_tax = annual_taxable * IL_RATE
    return _q(annual_tax / Decimal(pay_periods_per_year))
