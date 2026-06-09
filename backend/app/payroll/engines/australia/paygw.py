"""Australian PAYG Withholding income tax, 2026-27.

Reference: ATO NAT 1004 Schedule 1.

Stage 3 brackets in effect since July 2024 (carrying into 2026-27):
- 0 percent on first 18,200 (tax-free threshold)
- 16 percent on 18,201 to 45,000
- 30 percent on 45,001 to 135,000
- 37 percent on 135,001 to 190,000
- 45 percent above 190,000

Two regimes:
- 'tax_free_threshold_claimed = True' (standard): first 18,200 tax-free
- 'tax_free_threshold_claimed = False' (e.g., second job): taxed from 0
- 'has_tfn = False': flat 47 percent withholding (no TFN penalty)

Annualized method (annualize, apply brackets, divide back).
Production should use ATO formula coefficients per NAT 1004.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Optional


# Stage 3 brackets (as upper_bound, rate). None = open top.
BRACKETS_WITH_THRESHOLD: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("18200.00"), Decimal("0.00")),
    (Decimal("45000.00"), Decimal("0.16")),
    (Decimal("135000.00"), Decimal("0.30")),
    (Decimal("190000.00"), Decimal("0.37")),
    (None, Decimal("0.45")),
]

# Without threshold (foreign residents, second job): no tax-free band
BRACKETS_NO_THRESHOLD: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("45000.00"), Decimal("0.16")),
    (Decimal("135000.00"), Decimal("0.30")),
    (Decimal("190000.00"), Decimal("0.37")),
    (None, Decimal("0.45")),
]

NO_TFN_RATE = Decimal("0.47")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _annual_tax(annual_taxable: Decimal, brackets) -> Decimal:
    if annual_taxable <= 0:
        return Decimal("0")
    tax = Decimal("0")
    remaining = annual_taxable
    prev_top = Decimal("0")
    for top, rate in brackets:
        if top is None:
            tax += remaining * rate
            return tax
        band_size = top - prev_top
        if remaining <= band_size:
            tax += remaining * rate
            return tax
        tax += band_size * rate
        remaining -= band_size
        prev_top = top
    return tax


def calculate_paygw(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    tax_free_threshold_claimed: bool = True,
    has_tfn: bool = True,
    additional_withholding: Decimal = Decimal("0"),
) -> Decimal:
    """Calculate PAYG withholding for one pay period.

    Args:
        gross_pay: Taxable earnings this period.
        pay_periods_per_year: 12, 26, 52.
        tax_free_threshold_claimed: True if employee claimed it on TFN dec.
        has_tfn: False = penalty 47 percent flat rate.
        additional_withholding: Manual extra per period.
    """
    # No TFN: flat 47 percent
    if not has_tfn:
        return _q(gross_pay * NO_TFN_RATE) + additional_withholding

    annual_gross = gross_pay * Decimal(pay_periods_per_year)

    if tax_free_threshold_claimed:
        annual_tax = _annual_tax(annual_gross, BRACKETS_WITH_THRESHOLD)
    else:
        annual_tax = _annual_tax(annual_gross, BRACKETS_NO_THRESHOLD)

    period_tax = _q(annual_tax / Decimal(pay_periods_per_year))
    period_tax += additional_withholding

    return period_tax
