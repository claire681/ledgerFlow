"""Alberta provincial income tax, 2026.

Reference: CRA T4127 Payroll Deductions Formulas, 123rd Edition, effective July 1, 2026. Values verified against Table 8.1 (rates, thresholds, constants) and Table 8.10 (Alberta claim codes).

2026 verified figures from CRA T4127 Table 8.1:
- 8 percent on first 61,200
- 10 percent on 61,200 to 154,259
- 12 percent on 154,259 to 185,111
- 13 percent on 185,111 to 246,813
- 14 percent on 246,813 to 370,220
- 15 percent above 370,220

Basic Personal Amount (claim code 1): 22,769 (highest in Canada).

Note: Alberta reduced the lowest bracket rate from 10 percent (2025)
to 8 percent (2026).

Pure function.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Optional


BRACKETS_AB_2026: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("61200.00"), Decimal("0.08")),
    (Decimal("154259.00"), Decimal("0.10")),
    (Decimal("185111.00"), Decimal("0.12")),
    (Decimal("246813.00"), Decimal("0.13")),
    (Decimal("370220.00"), Decimal("0.14")),
    (None, Decimal("0.15")),
]

BPA_AB_2026 = Decimal("22769.00")
LOWEST_RATE_AB = Decimal("0.08")


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
