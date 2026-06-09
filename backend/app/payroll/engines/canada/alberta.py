"""Alberta provincial income tax, 2026.

Reference: Alberta Treasury Board and Finance, 2026 personal tax brackets.

2026 figures (placeholder; verify before production):
- 10 percent on first 148,269
- 12 percent on 148,269 to 177,922
- 13 percent on 177,922 to 237,230
- 14 percent on 237,230 to 355,845
- 15 percent above 355,845

Basic Personal Amount: 21,003 (highest in Canada).

Pure function.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Optional


BRACKETS_AB_2026: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("148269.00"), Decimal("0.10")),
    (Decimal("177922.00"), Decimal("0.12")),
    (Decimal("237230.00"), Decimal("0.13")),
    (Decimal("355845.00"), Decimal("0.14")),
    (None, Decimal("0.15")),
]

BPA_AB_2026 = Decimal("21003.00")
LOWEST_RATE_AB = Decimal("0.10")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _annual_tax(annual_taxable: Decimal) -> Decimal:
    if annual_taxable <= 0:
        return Decimal("0")
    tax = Decimal("0")
    remaining = annual_taxable
    prev_top = Decimal("0")
    for top, rate in BRACKETS_AB_2026:
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


def calculate_alberta_tax(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    td1_provincial_claim: Optional[Decimal] = None,
) -> Decimal:
    """Alberta provincial income tax for one pay period."""
    if td1_provincial_claim is None:
        td1_provincial_claim = BPA_AB_2026

    annual_gross = gross_pay * Decimal(pay_periods_per_year)
    annual_tax = _annual_tax(annual_gross)

    annual_credit = td1_provincial_claim * LOWEST_RATE_AB
    annual_tax = max(annual_tax - annual_credit, Decimal("0"))

    return _q(annual_tax / Decimal(pay_periods_per_year))
