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

# Canada Employment Amount (Table 8.2 of T4127 123rd Edition)
# Used in K4 credit: K4 = LOWEST_RATE * CEA
CANADA_EMPLOYMENT_AMOUNT_2026 = Decimal("1501.00")

# Base CPP rate portion for K2 credit
# Total CPP employee rate = 5.95% = Base 4.95% + First Additional 1.00%
# Only the BASE portion (4.95%) is eligible for the K2 tax credit.
# Ratio 0.0495/0.0595 extracts base from total.
BASE_CPP_RATE_2026 = Decimal("0.0495")
TOTAL_CPP_RATE_2026 = Decimal("0.0595")

# Annual maximums used to cap the K2 credit base (Table 8.3 and Table 8.7)
# Max base CPP contribution = YMCE * base_rate = 71,100 * 0.0495 = 3,519.45
MAX_BASE_CPP_ANNUAL_2026 = Decimal("3519.45")
# Max EI premium (Table 8.7)
MAX_EI_PREMIUM_ANNUAL_2026 = Decimal("1123.07")


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
    cpp_contribution: Decimal = Decimal("0"),
    ei_contribution: Decimal = Decimal("0"),
) -> Decimal:
    """Calculate federal income tax for one pay period.

    Implements T4127 Option 1 formula:
        T3 = _annual_tax(A) - K1 - K2 - K4
    where:
        A  = annualized gross
        K1 = LOWEST_RATE * TD1 claim (basic personal amount credit)
        K2 = LOWEST_RATE * (annualized base CPP + annualized EI), capped at annual maxes
        K4 = LOWEST_RATE * Canada Employment Amount

    Then period_tax = T3 / pay_periods.

    Args:
        gross_pay: Taxable earnings this period.
        pay_periods_per_year: 12, 24, 26, or 52.
        td1_federal_claim: Total TD1 federal claim amount in dollars.
            Defaults to Basic Personal Amount.
        additional_withholding: Manual extra withholding per period.
        cpp_contribution: Total CPP employee contribution this period
            (Base + First Additional = 5.95% of pensionable earnings).
            Used to compute K2 credit. Default 0 preserves pre-K2 behavior.
        ei_contribution: EI employee premium this period.
            Used to compute K2 credit. Default 0 preserves pre-K2 behavior.

    Returns:
        Federal income tax to withhold this period.
    """
    if td1_federal_claim is None:
        td1_federal_claim = BASIC_PERSONAL_AMOUNT_2026

    # Annualize this period
    annual_gross = gross_pay * Decimal(pay_periods_per_year)
    P = Decimal(pay_periods_per_year)

    # Progressive brackets on annual income (this is R*A - K from T4127)
    annual_tax = _annual_tax(annual_gross)

    # K1: TD1 claim credit at lowest bracket rate
    k1 = td1_federal_claim * LOWEST_RATE

    # K2: credit for BASE CPP and EI contributions (annualized, capped at max)
    # Formula: K2 = LOWEST_RATE * [(P * base_cpp, max annual base cpp) + (P * ei, max annual ei)]
    # Extract base CPP portion from total CPP: total * (base_rate / total_rate)
    base_cpp_this_period = cpp_contribution * (BASE_CPP_RATE_2026 / TOTAL_CPP_RATE_2026)
    annual_base_cpp = min(P * base_cpp_this_period, MAX_BASE_CPP_ANNUAL_2026)
    annual_ei = min(P * ei_contribution, MAX_EI_PREMIUM_ANNUAL_2026)
    k2 = LOWEST_RATE * (annual_base_cpp + annual_ei)

    # K4: Canada Employment Amount credit
    k4 = LOWEST_RATE * CANADA_EMPLOYMENT_AMOUNT_2026

    # Total annual tax after all credits: T3 = R*A - K - K1 - K2 - K4
    # (K is already baked into _annual_tax via the bracket walk)
    annual_tax = max(annual_tax - k1 - k2 - k4, Decimal("0"))

    # Period tax
    period_tax = _q(annual_tax / P)

    # Manual extra
    period_tax += additional_withholding

    return period_tax
