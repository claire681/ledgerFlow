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

# First Additional CPP rate (enhancement introduced 2019, phased in by 2023).
# Used to compute F5A: the portion of CPP contribution that reduces annual
# taxable income (not just a credit). Per CRA T4127 Step 1 formula for A.
FIRST_ADDITIONAL_CPP_RATE_2026 = Decimal("0.0100")

# Annual maximums used to cap the K2 credit base (Table 8.3 and Table 8.7)
# Max base CPP contribution = YMCE * base_rate = 71,100 * 0.0495 = 3,519.45
MAX_BASE_CPP_ANNUAL_2026 = Decimal("3519.45")
# Max EI premium (Table 8.7)
MAX_EI_PREMIUM_ANNUAL_2026 = Decimal("1123.07")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _annual_tax(annual_taxable: Decimal) -> Decimal:
    """T4127 Option 1: annual tax = R * A - K using Table 8.1 constants.

    Uses K-constant method (matches PDOC exactly) instead of bracket walk.
    Federal K constants for 2026 from T4127 Table 8.1.
    """
    if annual_taxable <= 0:
        return Decimal("0")
    A = annual_taxable
    if A <= Decimal("58523.00"):
        return A * Decimal("0.140") - Decimal("0")
    if A <= Decimal("117045.00"):
        return A * Decimal("0.205") - Decimal("3804.00")
    if A <= Decimal("181440.00"):
        return A * Decimal("0.260") - Decimal("10241.00")
    if A <= Decimal("258482.00"):
        return A * Decimal("0.290") - Decimal("15685.00")
    return A * Decimal("0.330") - Decimal("26024.00")


def calculate_federal_tax(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    td1_federal_claim: Optional[Decimal] = None,
    additional_withholding: Decimal = Decimal("0"),
    cpp_contribution: Decimal = Decimal("0"),
    ei_contribution: Decimal = Decimal("0"),
    ytd_cpp_base: Decimal = Decimal("0"),
    ytd_ei: Decimal = Decimal("0"),
    cpp2_contribution: Decimal = Decimal("0"),
) -> Decimal:
    """Calculate federal income tax for one pay period.

    Implements T4127 Option 1 formula:
        A  = P * (I - F5A)  where F5A = First Additional CPP per period
        T3 = _annual_tax(A) - K1 - K2 - K4
    where:
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

    # Deduct F5A: First Additional CPP + CPP2 reduce taxable income
    # T4127 Step 1: F5 = C * (0.01/0.0595) + C2
    # First Additional CPP is the 1% portion of base CPP contribution.
    # CPP2 is the full second additional contribution.
    # Only Base CPP + EI get credit treatment via K2.
    # T4127 Chapter 1: round F5A to 2 decimals before using in taxable_gross.
    first_additional_cpp = _q(cpp_contribution * (FIRST_ADDITIONAL_CPP_RATE_2026 / TOTAL_CPP_RATE_2026))
    f5a = first_additional_cpp + cpp2_contribution
    taxable_gross = gross_pay - f5a

    # Annualize this period
    annual_gross = taxable_gross * Decimal(pay_periods_per_year)
    P = Decimal(pay_periods_per_year)

    # Progressive brackets on annual income (this is R*A - K from T4127)
    annual_tax = _annual_tax(annual_gross)

    # K1: TD1 claim credit at lowest bracket rate
    k1 = td1_federal_claim * LOWEST_RATE

    # K2: credit for BASE CPP and EI contributions (annualized, capped at max)
    # T4127 Chapter 4: "If an employee has already contributed the maximum
    # CPP and EI for the year with the employer, use the maximum base CPP
    # contribution and the maximum EI premium to calculate the credit for
    # the rest of the year."
    if ytd_cpp_base >= MAX_BASE_CPP_ANNUAL_2026:
        # Employee already maxed base CPP - use annual max in credit
        annual_base_cpp = MAX_BASE_CPP_ANNUAL_2026
    else:
        # Extract base CPP portion from total CPP contribution this period
        base_cpp_this_period = cpp_contribution * (BASE_CPP_RATE_2026 / TOTAL_CPP_RATE_2026)
        annual_base_cpp = min(P * base_cpp_this_period, MAX_BASE_CPP_ANNUAL_2026)

    if ytd_ei >= MAX_EI_PREMIUM_ANNUAL_2026:
        # Employee already maxed EI - use annual max in credit
        annual_ei = MAX_EI_PREMIUM_ANNUAL_2026
    else:
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
