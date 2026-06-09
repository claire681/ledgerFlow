"""US federal income tax withholding, 2026.

Reference: IRS Publication 15-T, percentage method.

2026 figures (placeholders; verify Pub 15-T when published):

Standard deductions:
- Single / married filing separately: 15,000
- Married filing jointly / qualifying surviving spouse: 30,000
- Head of household: 22,500

Brackets (Single):
- 10 percent on first 11,925
- 12 percent on 11,925 to 48,475
- 22 percent on 48,475 to 103,350
- 24 percent on 103,350 to 197,300
- 32 percent on 197,300 to 250,525
- 35 percent on 250,525 to 626,350
- 37 percent above 626,350

MFJ doubles most thresholds. HoH between.

W-4 (2020+ form):
- Step 3: dependents credit (2,000 per qualifying child + 500 per other dependent)
- Step 4c: extra withholding per pay period (we accept as additional_withholding)

v1 skips Step 2 multiple-jobs adjustment.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Optional


STANDARD_DEDUCTION = {
    "single": Decimal("15000.00"),
    "married_filing_jointly": Decimal("30000.00"),
    "married_filing_separately": Decimal("15000.00"),
    "head_of_household": Decimal("22500.00"),
    "qualifying_surviving_spouse": Decimal("30000.00"),
}

BRACKETS_SINGLE: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("11925.00"), Decimal("0.10")),
    (Decimal("48475.00"), Decimal("0.12")),
    (Decimal("103350.00"), Decimal("0.22")),
    (Decimal("197300.00"), Decimal("0.24")),
    (Decimal("250525.00"), Decimal("0.32")),
    (Decimal("626350.00"), Decimal("0.35")),
    (None, Decimal("0.37")),
]

BRACKETS_MFJ: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("23850.00"), Decimal("0.10")),
    (Decimal("96950.00"), Decimal("0.12")),
    (Decimal("206700.00"), Decimal("0.22")),
    (Decimal("394600.00"), Decimal("0.24")),
    (Decimal("501050.00"), Decimal("0.32")),
    (Decimal("751600.00"), Decimal("0.35")),
    (None, Decimal("0.37")),
]

BRACKETS_HOH: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("17000.00"), Decimal("0.10")),
    (Decimal("64850.00"), Decimal("0.12")),
    (Decimal("103350.00"), Decimal("0.22")),
    (Decimal("197300.00"), Decimal("0.24")),
    (Decimal("250500.00"), Decimal("0.32")),
    (Decimal("626350.00"), Decimal("0.35")),
    (None, Decimal("0.37")),
]

BRACKETS_BY_STATUS = {
    "single": BRACKETS_SINGLE,
    "married_filing_jointly": BRACKETS_MFJ,
    "married_filing_separately": BRACKETS_SINGLE,
    "head_of_household": BRACKETS_HOH,
    "qualifying_surviving_spouse": BRACKETS_MFJ,
}

QUALIFYING_CHILD_CREDIT = Decimal("2000.00")
OTHER_DEPENDENT_CREDIT = Decimal("500.00")


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


def calculate_federal_tax(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    filing_status: str = "single",
    qualifying_children: int = 0,
    other_dependents: int = 0,
    additional_withholding: Decimal = Decimal("0"),
) -> Decimal:
    """Calculate US federal income tax withholding for one pay period."""
    if filing_status not in BRACKETS_BY_STATUS:
        filing_status = "single"

    annual_gross = gross_pay * Decimal(pay_periods_per_year)
    annual_taxable = max(
        annual_gross - STANDARD_DEDUCTION[filing_status],
        Decimal("0"),
    )
    annual_tax = _annual_tax(annual_taxable, BRACKETS_BY_STATUS[filing_status])

    dependents_credit = (
        Decimal(qualifying_children) * QUALIFYING_CHILD_CREDIT
        + Decimal(other_dependents) * OTHER_DEPENDENT_CREDIT
    )
    annual_tax = max(annual_tax - dependents_credit, Decimal("0"))

    period_tax = _q(annual_tax / Decimal(pay_periods_per_year))
    period_tax += additional_withholding
    return period_tax
