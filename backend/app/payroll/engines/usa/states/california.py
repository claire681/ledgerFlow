"""California state income tax withholding, 2026.

Reference: California EDD DE 44, Method B.

2024 figures (placeholders for 2026; verify EDD publications):

Standard deduction:
- Single / married filing separately: 5,540
- MFJ / HoH: 11,080

9 brackets, top 12.3 percent.
Mental Health Services Tax: additional 1 percent on taxable income above 1,000,000.

v1 uses annualized method. Production should use EDD Method B with allowance
tables for exemption credits.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Optional


CA_STANDARD_DEDUCTION = {
    "single": Decimal("5540.00"),
    "married_filing_jointly": Decimal("11080.00"),
    "married_filing_separately": Decimal("5540.00"),
    "head_of_household": Decimal("11080.00"),
}

CA_BRACKETS_SINGLE: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("10756.00"), Decimal("0.01")),
    (Decimal("25499.00"), Decimal("0.02")),
    (Decimal("40245.00"), Decimal("0.04")),
    (Decimal("55866.00"), Decimal("0.06")),
    (Decimal("70606.00"), Decimal("0.08")),
    (Decimal("360659.00"), Decimal("0.093")),
    (Decimal("432787.00"), Decimal("0.103")),
    (Decimal("721314.00"), Decimal("0.113")),
    (None, Decimal("0.123")),
]

CA_BRACKETS_MFJ: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("21512.00"), Decimal("0.01")),
    (Decimal("50998.00"), Decimal("0.02")),
    (Decimal("80490.00"), Decimal("0.04")),
    (Decimal("111732.00"), Decimal("0.06")),
    (Decimal("141212.00"), Decimal("0.08")),
    (Decimal("721318.00"), Decimal("0.093")),
    (Decimal("865574.00"), Decimal("0.103")),
    (Decimal("1442628.00"), Decimal("0.113")),
    (None, Decimal("0.123")),
]

CA_BRACKETS = {
    "single": CA_BRACKETS_SINGLE,
    "married_filing_jointly": CA_BRACKETS_MFJ,
    "married_filing_separately": CA_BRACKETS_SINGLE,
    "head_of_household": CA_BRACKETS_MFJ,
}

MENTAL_HEALTH_THRESHOLD = Decimal("1000000.00")
MENTAL_HEALTH_RATE = Decimal("0.01")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _annual_tax(taxable: Decimal, brackets) -> Decimal:
    if taxable <= 0:
        return Decimal("0")
    tax = Decimal("0")
    remaining = taxable
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


def calculate_california_tax(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    filing_status: str = "single",
    **kwargs,
) -> Decimal:
    """California state income tax for one pay period."""
    if filing_status not in CA_BRACKETS:
        filing_status = "single"

    annual_gross = gross_pay * Decimal(pay_periods_per_year)
    annual_taxable = max(
        annual_gross - CA_STANDARD_DEDUCTION[filing_status],
        Decimal("0"),
    )

    annual_tax = _annual_tax(annual_taxable, CA_BRACKETS[filing_status])

    if annual_taxable > MENTAL_HEALTH_THRESHOLD:
        mh_tax = (annual_taxable - MENTAL_HEALTH_THRESHOLD) * MENTAL_HEALTH_RATE
        annual_tax += mh_tax

    return _q(annual_tax / Decimal(pay_periods_per_year))
