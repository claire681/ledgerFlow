"""
Ontario provincial income tax, 2026.

Reference:
CRA T4127 Payroll Deductions Formulas,
122nd Edition, effective January 1, 2026.

Values verified against Table 8.1
(rates, thresholds, constants),
Table 8.2 (BPA, S2),
and Table 8.18 (Ontario claim codes).

2026 verified figures from CRA T4127 Table 8.1:

- 5.05 percent on first 53,891
- 9.15 percent on 53,891 to 107,785
- 11.16 percent on 107,785 to 150,000
- 12.16 percent on 150,000 to 220,000
- 13.16 percent above 220,000

K constants (KP):
- Bracket 1: 0
- Bracket 2: 2,210
- Bracket 3: 4,376
- Bracket 4: 5,876
- Bracket 5: 8,076

Basic Personal Amount (claim code 1): 12,989

Ontario has THREE additional adjustments not present in other provinces:

V1 - Provincial surtax (Chapter 4 Step 5):
- T4 <= 5,818:              V1 = 0
- 5,818 < T4 <= 7,446:      V1 = 0.20 * (T4 - 5,818)
- T4 > 7,446:               V1 = (0.20 * (T4 - 5,818)) + (0.36 * (T4 - 7,446))

V2 - Ontario Health Premium (Chapter 4 Step 5):
- A <= 20,000:              V2 = 0
- 20,000 < A <= 36,000:     V2 = lesser of 300 or 0.06 * (A - 20,000)
- 36,000 < A <= 48,000:     V2 = lesser of 450 or 300 + (0.06 * (A - 36,000))
- 48,000 < A <= 72,000:     V2 = lesser of 600 or 450 + (0.25 * (A - 48,000))
- 72,000 < A <= 200,000:    V2 = lesser of 750 or 600 + (0.25 * (A - 72,000))
- A > 200,000:              V2 = lesser of 900 or 750 + (0.25 * (A - 200,000))

S - Ontario tax reduction (Chapter 4 Step 5):
- S = lesser of (T4 + V1) OR (2 * (300 + Y) - (T4 + V1))
- Y = 554 * disabled_dependants + 554 * dependants_under_19
- If S < 0, S = 0

T2 formula (T4127 Step 5):
T2 = T4 + V1 + V2 - S - K1P - K2P

Pure function.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional


# Ontario 2026 constants from CRA T4127 Table 8.1
BPA_ON_2026 = Decimal("12989.00")
LOWEST_RATE_ON = Decimal("0.0505")

# K2P credit rates (mirror federal K2)
BASE_CPP_RATE_2026 = Decimal("0.0495")
TOTAL_CPP_RATE_2026 = Decimal("0.0595")
FIRST_ADDITIONAL_CPP_RATE_2026 = Decimal("0.0100")

MAX_BASE_CPP_ANNUAL_2026 = Decimal("3519.45")
MAX_EI_PREMIUM_ANNUAL_2026 = Decimal("1123.07")

# Ontario tax reduction constants
ONTARIO_S2 = Decimal("300.00")  # T4127 Table 8.2

# Ontario surtax thresholds (T4127 Table 8.2 / Step 5)
SURTAX_THRESHOLD_1 = Decimal("5818.00")
SURTAX_THRESHOLD_2 = Decimal("7446.00")
SURTAX_RATE_1 = Decimal("0.20")
SURTAX_RATE_2 = Decimal("0.36")

# Ontario Health Premium thresholds
OHP_THRESHOLD_1 = Decimal("20000.00")
OHP_THRESHOLD_2 = Decimal("36000.00")
OHP_THRESHOLD_3 = Decimal("48000.00")
OHP_THRESHOLD_4 = Decimal("72000.00")
OHP_THRESHOLD_5 = Decimal("200000.00")
OHP_MAX_1 = Decimal("300.00")
OHP_MAX_2 = Decimal("450.00")
OHP_MAX_3 = Decimal("600.00")
OHP_MAX_4 = Decimal("750.00")
OHP_MAX_5 = Decimal("900.00")
OHP_RATE_LOW = Decimal("0.06")
OHP_RATE_HIGH = Decimal("0.25")

# Ontario tax reduction dependant amount
DEPENDANT_AMOUNT_ON = Decimal("554.00")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _annual_tax(annual_taxable: Decimal) -> Decimal:
    """T4127 Option 1: annual Ontario tax = V * A - KP using Table 8.1 constants."""
    if annual_taxable <= 0:
        return Decimal("0")
    A = annual_taxable
    if A <= Decimal("53891.00"):
        return A * Decimal("0.0505") - Decimal("0")
    if A <= Decimal("107785.00"):
        return A * Decimal("0.0915") - Decimal("2210.00")
    if A <= Decimal("150000.00"):
        return A * Decimal("0.1116") - Decimal("4376.00")
    if A <= Decimal("220000.00"):
        return A * Decimal("0.1216") - Decimal("5876.00")
    return A * Decimal("0.1316") - Decimal("8076.00")


def _compute_surtax_v1(t4: Decimal) -> Decimal:
    """T4127 Step 5: Ontario V1 surtax on T4."""
    if t4 <= SURTAX_THRESHOLD_1:
        return Decimal("0")
    if t4 <= SURTAX_THRESHOLD_2:
        return SURTAX_RATE_1 * (t4 - SURTAX_THRESHOLD_1)
    return (
        SURTAX_RATE_1 * (t4 - SURTAX_THRESHOLD_1)
        + SURTAX_RATE_2 * (t4 - SURTAX_THRESHOLD_2)
    )


def _compute_ohp_v2(annual_A: Decimal) -> Decimal:
    """T4127 Step 5: Ontario Health Premium on annual taxable income."""
    if annual_A <= OHP_THRESHOLD_1:
        return Decimal("0")
    if annual_A <= OHP_THRESHOLD_2:
        return min(OHP_MAX_1, OHP_RATE_LOW * (annual_A - OHP_THRESHOLD_1))
    if annual_A <= OHP_THRESHOLD_3:
        return min(OHP_MAX_2, OHP_MAX_1 + OHP_RATE_LOW * (annual_A - OHP_THRESHOLD_2))
    if annual_A <= OHP_THRESHOLD_4:
        return min(OHP_MAX_3, OHP_MAX_2 + OHP_RATE_HIGH * (annual_A - OHP_THRESHOLD_3))
    if annual_A <= OHP_THRESHOLD_5:
        return min(OHP_MAX_4, OHP_MAX_3 + OHP_RATE_HIGH * (annual_A - OHP_THRESHOLD_4))
    return min(OHP_MAX_5, OHP_MAX_4 + OHP_RATE_HIGH * (annual_A - OHP_THRESHOLD_5))


def _compute_reduction_s(
    t4_plus_v1: Decimal,
    disabled_dependants: int = 0,
    dependants_under_19: int = 0,
) -> Decimal:
    """T4127 Step 5: Ontario tax reduction S.
    
    S = lesser of (T4+V1) or (2 * (S2 + Y) - (T4+V1))
    Y = dependant_amount * (disabled + under19)
    """
    Y = DEPENDANT_AMOUNT_ON * Decimal(disabled_dependants + dependants_under_19)
    option_2 = Decimal("2") * (ONTARIO_S2 + Y) - t4_plus_v1
    s = min(t4_plus_v1, option_2)
    return max(s, Decimal("0"))


def calculate_ontario_tax(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    td1_provincial_claim: Optional[Decimal] = None,
    cpp_contribution: Decimal = Decimal("0"),
    ei_contribution: Decimal = Decimal("0"),
    ytd_cpp_base: Decimal = Decimal("0"),
    ytd_ei: Decimal = Decimal("0"),
    cpp2_contribution: Decimal = Decimal("0"),
    disabled_dependants: int = 0,
    dependants_under_19: int = 0,
) -> Decimal:
    """
    Ontario provincial income tax for one pay period.
    
    Implements T4127 Chapter 4 Step 5:
    T2 = T4 + V1 + V2 - S - K1P - K2P
    
    Where:
    T4 = annual basic Ontario tax (bracket walk of annualized gross)
    V1 = Ontario surtax on T4
    V2 = Ontario Health Premium
    S  = Ontario tax reduction
    K1P = LOWEST_RATE_ON * TD1 provincial claim
    K2P = LOWEST_RATE_ON * (annualized base CPP + annualized EI), YTD-max aware
    
    Ontario has NO K4P (unlike Yukon which does).
    """
    if td1_provincial_claim is None:
        td1_provincial_claim = BPA_ON_2026

    # Deduct F5A: First Additional CPP + CPP2 reduce taxable income
    # T4127 Step 1: F5 = C * (0.01/0.0595) + C2
    # T4127 Chapter 1: round F5A to 2 decimals before using in taxable_gross.
    first_additional_cpp = _q(cpp_contribution * (FIRST_ADDITIONAL_CPP_RATE_2026 / TOTAL_CPP_RATE_2026))
    f5a = first_additional_cpp + cpp2_contribution
    taxable_gross = gross_pay - f5a

    annual_gross = taxable_gross * Decimal(pay_periods_per_year)
    P = Decimal(pay_periods_per_year)

    # T4: annual basic Ontario tax (K-constant method)
    t4 = _annual_tax(annual_gross)

    # V1: Ontario surtax on T4
    v1 = _compute_surtax_v1(t4)

    # V2: Ontario Health Premium
    v2 = _compute_ohp_v2(annual_gross)

    # S: Ontario tax reduction (based on T4 + V1)
    s = _compute_reduction_s(t4 + v1, disabled_dependants, dependants_under_19)

    # K1P: TD1 provincial claim credit
    k1p = td1_provincial_claim * LOWEST_RATE_ON

    # K2P: Alberta credit for base CPP and EI contributions
    # T4127 Chapter 4: if YTD is at max, use annual max in credit
    if ytd_cpp_base >= MAX_BASE_CPP_ANNUAL_2026:
        annual_base_cpp = MAX_BASE_CPP_ANNUAL_2026
    else:
        base_cpp_this_period = cpp_contribution * (BASE_CPP_RATE_2026 / TOTAL_CPP_RATE_2026)
        annual_base_cpp = min(P * base_cpp_this_period, MAX_BASE_CPP_ANNUAL_2026)
    
    if ytd_ei >= MAX_EI_PREMIUM_ANNUAL_2026:
        annual_ei = MAX_EI_PREMIUM_ANNUAL_2026
    else:
        annual_ei = min(P * ei_contribution, MAX_EI_PREMIUM_ANNUAL_2026)
    
    k2p = LOWEST_RATE_ON * (annual_base_cpp + annual_ei)

    # T2: T4127 Step 5 final formula
    # T2 = T4 + V1 + V2 - S - K1P - K2P (never negative)
    annual_tax = max(t4 + v1 + v2 - s - k1p - k2p, Decimal("0"))

    return _q(annual_tax / P)