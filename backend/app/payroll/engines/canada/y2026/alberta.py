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
    cpp_contribution: Decimal = Decimal("0"),
    ei_contribution: Decimal = Decimal("0"),
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

    # Deduct F5A: First Additional CPP portion reduces taxable income
    # (T4127 Step 1). Mirrors the same treatment as federal.
    first_additional_cpp = cpp_contribution * (FIRST_ADDITIONAL_CPP_RATE_2026 / TOTAL_CPP_RATE_2026)
    taxable_gross = gross_pay - first_additional_cpp

    annual_gross = taxable_gross * Decimal(pay_periods_per_year)
    P = Decimal(pay_periods_per_year)

    # T4: annual basic Alberta tax (bracket walk)
    annual_tax = _annual_tax(annual_gross)

    # K1P: TD1 provincial claim credit
    k1p = td1_provincial_claim * LOWEST_RATE_AB

    # K2P: Alberta credit for base CPP and EI contributions
    base_cpp_this_period = cpp_contribution * (BASE_CPP_RATE_2026 / TOTAL_CPP_RATE_2026)
    annual_base_cpp = min(P * base_cpp_this_period, MAX_BASE_CPP_ANNUAL_2026)
    annual_ei = min(P * ei_contribution, MAX_EI_PREMIUM_ANNUAL_2026)
    k2p = LOWEST_RATE_AB * (annual_base_cpp + annual_ei)

    # T2: final annual Alberta tax (never negative)
    annual_tax = max(annual_tax - k1p - k2p, Decimal("0"))

    return _q(annual_tax / P)
