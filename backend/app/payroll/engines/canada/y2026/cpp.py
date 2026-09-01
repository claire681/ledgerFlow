"""Canada Pension Plan (CPP and CPP2) calculation.

Implements the exact formulas from CRA T4127 Chapter 6 (January 2026 122nd Edition,
July 2026 123rd Edition confirms no formula change).

CRA T4127 Chapter 6 formulas (Option 1):

    CPP for salaried employees:
        C = lesser of:
            (i)  MAX_CPP_ANNUAL * (PM/12) - D
            (ii) CPP_RATE * [PI - BASIC_EXEMPTION/P]
        If negative: C = 0

    CPP2 for salaried employees:
        C2 = lesser of:
            (i)  MAX_CPP2_ANNUAL * (PM/12) - D2
            (ii) (PIYTD + PI - W) * CPP2_RATE
        where W = greater of (PIYTD, YMPE * PM/12)
        If negative: C2 = 0

Variables (CRA notation):
    C, C2   CPP / CPP2 contributions this pay period
    PI      Pensionable earnings this pay period
    PIYTD   Pensionable earnings YTD BEFORE this pay period
    P       Pay periods per year
    PM      Pensionable months (usually 12; less for mid-year hire/termination)
    D       YTD CPP paid BEFORE this pay period (with this employer)
    D2      YTD CPP2 paid BEFORE this pay period (with this employer)
    W       Factor W for CPP2 threshold
    YMPE    Year's Maximum Pensionable Earnings

2026 verified constants from CRA T4127 Tables 8.3, 8.4:
    YMPE                : 74,600
    YAMPE               : 85,000  (used for max cap on CPP2 earnings)
    BASIC_EXEMPTION     : 3,500
    CPP_RATE            : 0.0595 (employee = employer)
    CPP2_RATE           : 0.04
    MAX_CPP_ANNUAL_2026 : 4,230.45  = (YMPE - BASIC_EXEMPTION) * CPP_RATE
    MAX_CPP2_ANNUAL_2026: 416.00    = (YAMPE - YMPE) * CPP2_RATE

Pure function. Employer matches employee for both CPP and CPP2.
Quebec (QC) uses QPP instead; this returns zero for QC.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple, Optional


# 2026 constants, verified against CRA T4127 Payroll Deductions Formulas.
YMPE_2026 = Decimal("74600.00")
YAMPE_2026 = Decimal("85000.00")
BASIC_EXEMPTION = Decimal("3500.00")
CPP_RATE = Decimal("0.0595")
CPP2_RATE = Decimal("0.0400")
MAX_CPP_ANNUAL_2026 = Decimal("4230.45")
MAX_CPP2_ANNUAL_2026 = Decimal("416.00")


def _q(amount: Decimal) -> Decimal:
    """Quantize to 2 decimal places, half-up rounding."""
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_cpp(
    gross_pay: Decimal,
    ytd_pensionable_earnings: Decimal,
    pay_periods_per_year: int,
    pensionable_months: int = 12,
    ytd_cpp_paid: Decimal = Decimal("0"),
    ytd_cpp2_paid: Decimal = Decimal("0"),
    cpp_exempt: bool = False,
    province: Optional[str] = None,
) -> Tuple[Decimal, Decimal, Decimal]:
    """Calculate CPP and CPP2 for one pay period per T4127 Chapter 6.

    Args:
        gross_pay: PI - pensionable earnings this pay period.
        ytd_pensionable_earnings: PIYTD - pensionable earnings YTD BEFORE this pay period.
        pay_periods_per_year: P - 12, 24, 26, or 52.
        pensionable_months: PM - months requiring CPP deduction (usually 12).
        ytd_cpp_paid: D - YTD CPP paid BEFORE this pay period.
        ytd_cpp2_paid: D2 - YTD CPP2 paid BEFORE this pay period.
        cpp_exempt: Under 18 or over 70.
        province: 'QC' returns (0, 0) as QPP handles Quebec separately.

    Returns:
        (cpp_amount, cpp2_amount, new_ytd_pensionable_earnings)
        Both amounts are the EMPLOYEE portion. Employer matches exactly.
    """
    if cpp_exempt or province == "QC":
        return (Decimal("0"), Decimal("0"), ytd_pensionable_earnings)

    PI = gross_pay
    PIYTD = ytd_pensionable_earnings
    P = Decimal(pay_periods_per_year)
    PM = Decimal(pensionable_months)
    D = ytd_cpp_paid
    D2 = ytd_cpp2_paid

    # ---- CPP (Factor C) ----
    # C = lesser of:
    #   (i)  MAX_CPP_ANNUAL * (PM/12) - D
    #   (ii) CPP_RATE * [PI - BASIC_EXEMPTION/P]
    # If negative: C = 0
    ceiling_c = MAX_CPP_ANNUAL_2026 * PM / Decimal("12") - D
    formula_ii_c = CPP_RATE * (PI - BASIC_EXEMPTION / P)
    cpp_amount = max(min(ceiling_c, formula_ii_c), Decimal("0"))
    cpp_amount = _q(cpp_amount)

    # Track new YTD pensionable earnings (used by downstream calcs).
    # PI counts toward PIYTD regardless of whether CPP was capped.
    new_ytd_pensionable = PIYTD + PI

    # ---- CPP2 (Factor C2) ----
    # W = greater of (PIYTD, YMPE * PM/12)
    # C2 = lesser of:
    #   (i)  MAX_CPP2_ANNUAL * (PM/12) - D2
    #   (ii) (PIYTD + PI - W) * CPP2_RATE
    # If negative: C2 = 0
    W = max(PIYTD, YMPE_2026 * PM / Decimal("12"))
    ceiling_c2 = MAX_CPP2_ANNUAL_2026 * PM / Decimal("12") - D2
    cpp2_earnings = PIYTD + PI - W
    formula_ii_c2 = cpp2_earnings * CPP2_RATE
    cpp2_amount = max(min(ceiling_c2, formula_ii_c2), Decimal("0"))
    cpp2_amount = _q(cpp2_amount)

    return (cpp_amount, cpp2_amount, new_ytd_pensionable)
