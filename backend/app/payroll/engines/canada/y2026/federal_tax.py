"""Canadian federal income tax calculation, 2026.

Reference: CRA T4127 Payroll Deductions Formulas, 123rd Edition, effective July 1, 2026. Values verified against Table 8.1 (rates, thresholds, constants) and Table 8.9 (federal claim codes).

Method: annualize period gross, apply progressive brackets, subtract
TD1 claim credit at lowest bracket rate, divide back by pay periods.

2026 verified figures from CRA T4127:
- Brackets:
    14.0 percent up to 58,523
    20.5 percent on 58,523 to 117,045
    26.0 percent on 117,045 to 181,440
    29.0 percent on 181,440 to 258,482
    33.0 percent above 258,482
- Basic Personal Amount (claim code 1): 16,452
- Lowest bracket rate: 14 percent (dropped from 15 percent under
  the Making Life More Affordable for Canadians Act)

Pure function. Quebec uses Quebec provincial regime (separate module).
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Optional


# Brackets as (upper_bound, rate). upper_bound=None means open top.
BRACKETS_2026: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("58523.00"), Decimal("0.140")),
    (Decimal("117045.00"), Decimal("0.205")),
    (Decimal("181440.00"), Decimal("0.260")),
    (Decimal("258482.00"), Decimal("0.290")),
    (None, Decimal("0.330")),
]

BASIC_PERSONAL_AMOUNT_2026 = Decimal("16452.00")
LOWEST_RATE = Decimal("0.140")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _annual_tax(annual_taxable: Decimal) -> Decimal:
    """Apply progressive brackets to annual taxable income."""
    if annual_taxable <= 0:
        return Decimal("0")

    tax = Decimal("0")
    remaining = annual_taxable
    prev_top = Decimal("0")

    for top, rate in BRACKETS_2026:
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


def calculate_federal_tax(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    td1_federal_claim: Optional[Decimal] = None,
    additional_withholding: Decimal = Decimal("0"),
) -> Decimal:
    """Calculate federal income tax for one pay period.

    Args:
        gross_pay: Taxable earnings this period.
        pay_periods_per_year: 12, 24, 26, or 52.
        td1_federal_claim: Total TD1 federal claim amount in dollars.
            Defaults to Basic Personal Amount.
        additional_withholding: Manual extra withholding per period.

    Returns:
        Federal income tax to withhold this period.
    """
    if td1_federal_claim is None:
        td1_federal_claim = BASIC_PERSONAL_AMOUNT_2026

    # Annualize this period
    annual_gross = gross_pay * Decimal(pay_periods_per_year)

    # Progressive brackets on annual income
    annual_tax = _annual_tax(annual_gross)

    # TD1 claim becomes a non-refundable credit at the lowest bracket rate
    annual_credit = td1_federal_claim * LOWEST_RATE
    annual_tax = max(annual_tax - annual_credit, Decimal("0"))

    # Period tax
    period_tax = _q(annual_tax / Decimal(pay_periods_per_year))

    # Manual extra
    period_tax += additional_withholding

    return period_tax
