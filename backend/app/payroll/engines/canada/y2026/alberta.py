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

# For K2P credit (mirrors K2 in federal_tax.py).
# Only the BASE portion of CPP (4.95%) is eligible for the K2P tax credit.
BASE_CPP_RATE_2026 = Decimal("0.0495")
TOTAL_CPP_RATE_2026 = Decimal("0.0595")

# First Additional CPP rate (enhancement introduced 2019, phased in by 2023).
# Used to compute F5A: the portion of CPP contribution that reduces annual
# taxable income (not just a credit). Per CRA T4127 Step 1 formula for A.
FIRST_ADDITIONAL_CPP_RATE_2026 = Decimal("0.0100")

# Annual maximums for capping the K2P credit base (T4127 Table 8.3 and Table 8.7)
MAX_BASE_CPP_ANNUAL_2026 = Decimal("3519.45")   # 71,100 * 0.0495
MAX_EI_PREMIUM_ANNUAL_2026 = Decimal("1123.07")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _annual_tax(annual_taxable: Decimal) -> Decimal:
    """T4127 Option 1: annual Alberta tax = V * A - KP using Table 8.1 constants."""
    if annual_taxable <= 0:
        return Decimal("0")
    A = annual_taxable
    if A <= Decimal("61200.00"):
        return A * Decimal("0.0800") - Decimal("0")
    if A <= Decimal("154259.00"):
        return A * Decimal("0.1000") - Decimal("1224.00")
    if A <= Decimal("185111.00"):
        return A * Decimal("0.1200") - Decimal("4309.00")
    if A <= Decimal("246813.00"):
        return A * Decimal("0.1300") - Decimal("6160.00")
    if A <= Decimal("370220.00"):
        return A * Decimal("0.1400") - Decimal("8628.00")
    return A * Decimal("0.1500") - Decimal("12331.00")


def calculate_alberta_tax(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    td1_provincial_claim: Optional[Decimal] = None,
    cpp_contribution: Decimal = Decimal("0"),
    ei_contribution: Decimal = Decimal("0"),
    ytd_cpp_base: Decimal = Decimal("0"),
    ytd_ei: Decimal = Decimal("0"),
    cpp2_contribution: Decimal = Decimal("0"),
) -> Decimal:
    """Alberta provincial income tax for one pay period.

    Implements T4127 Chapter 4 Step 5 for Alberta:
        T2 = T4 - K1P - K2P
    where:
        T4  = annual basic Alberta tax (bracket walk of annualized gross)
        K1P = LOWEST_RATE_AB * TD1 provincial claim
        K2P = LOWEST_RATE_AB * (annualized base CPP + annualized EI), capped at annual maxes

    Alberta does not have K3P, K4P, or LCP credits (unlike some provinces).
    """
    if td1_provincial_claim is None:
        td1_provincial_claim = BPA_AB_2026

    # Deduct F5A: First Additional CPP + CPP2 reduce taxable income
    # T4127 Step 1: F5 = C * (0.01/0.0595) + C2
    # First Additional CPP is the 1% portion of base CPP contribution.
    # CPP2 is the full second additional contribution.
    # T4127 Chapter 1: round F5A to 2 decimals before using in taxable_gross.
    first_additional_cpp = _q(cpp_contribution * (FIRST_ADDITIONAL_CPP_RATE_2026 / TOTAL_CPP_RATE_2026))
    f5a = first_additional_cpp + cpp2_contribution
    taxable_gross = gross_pay - f5a

    annual_gross = taxable_gross * Decimal(pay_periods_per_year)
    P = Decimal(pay_periods_per_year)

    # T4: annual basic Alberta tax (bracket walk)
    annual_tax = _annual_tax(annual_gross)

    # K1P: TD1 provincial claim credit
    k1p = td1_provincial_claim * LOWEST_RATE_AB

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
    k2p = LOWEST_RATE_AB * (annual_base_cpp + annual_ei)

    # T2: final annual Alberta tax (never negative)
    annual_tax = max(annual_tax - k1p - k2p, Decimal("0"))

    return _q(annual_tax / P)
