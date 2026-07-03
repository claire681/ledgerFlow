"""Canada Pension Plan (CPP and CPP2) calculation.

Reference: CRA T4127 Payroll Deductions Formulas, 123rd Edition, effective July 1, 2026. Values verified against Table 8.3 (CPP contribution rates and amounts) and Table 8.4 (CPP2 second additional rates and amounts).

2026 verified constants from CRA T4127 Table 8.3 and Table 8.4:
- YMPE (Year's Maximum Pensionable Earnings): 74,600
- YAMPE (Year's Additional Maximum Pensionable Earnings): 85,000
- Basic exemption: 3,500
- YMCE (Year's Maximum Contributory Earnings): 71,100 (= YMPE minus Basic exemption)
- CPP1 rate: 5.95 percent (employee and employer each)
- CPP1 maximum contribution: 4,230.45 per side
- CPP2 rate: 4.0 percent (employee and employer each) on YMPE-YAMPE band
- CPP2 maximum contribution: 416.00 per side

Pure function. Employer matches CPP and CPP2 exactly.
Quebec (QC) uses QPP instead; this returns zero for QC.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple, Optional


# 2026 constants, verified against CRA T4127 Payroll Deductions Formulas 123rd Edition.
YMPE_2026 = Decimal("74600.00")
YAMPE_2026 = Decimal("85000.00")
BASIC_EXEMPTION = Decimal("3500.00")
CPP_RATE = Decimal("0.0595")
CPP2_RATE = Decimal("0.0400")


def _q(amount: Decimal) -> Decimal:
    """Quantize to 2 decimal places, banker style half-up."""
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_cpp(
    gross_pay: Decimal,
    ytd_pensionable_earnings: Decimal,
    pay_periods_per_year: int,
    cpp_exempt: bool = False,
    province: Optional[str] = None,
) -> Tuple[Decimal, Decimal, Decimal]:
    """Calculate CPP and CPP2 for one pay period.

    Args:
        gross_pay: Total pensionable earnings this period.
        ytd_pensionable_earnings: YTD pensionable earnings BEFORE this period.
        pay_periods_per_year: 12, 24, 26, or 52.
        cpp_exempt: Under 18 or over 70.
        province: 'QC' returns zero (QPP module handles Quebec).

    Returns:
        (cpp_amount, cpp2_amount, new_ytd_pensionable_earnings)
        Both amounts are the EMPLOYEE portion. Employer matches.
    """
    if cpp_exempt or province == "QC":
        return (Decimal("0"), Decimal("0"), ytd_pensionable_earnings)

    period_exemption = _q(BASIC_EXEMPTION / Decimal(pay_periods_per_year))

    # Pensionable earnings this period (cannot go below zero)
    period_pensionable = max(gross_pay - period_exemption, Decimal("0"))

    # YMPE cap, expressed net of basic exemption since exemption is per-period
    max_contributory = YMPE_2026 - BASIC_EXEMPTION
    if ytd_pensionable_earnings + period_pensionable > max_contributory:
        period_pensionable = max(
            max_contributory - ytd_pensionable_earnings, Decimal("0")
        )

    new_ytd = ytd_pensionable_earnings + period_pensionable

    cpp_amount = _q(period_pensionable * CPP_RATE)

    # CPP2 on the YMPE to YAMPE band
    cpp2_amount = Decimal("0")
    cpp2_band_max = YAMPE_2026 - YMPE_2026

    # Calculate any CPP2-eligible earnings this period
    ytd_above_ympe_before = max(
        ytd_pensionable_earnings - max_contributory, Decimal("0")
    )

    # Total pensionable this period treats the YMPE cap separately; CPP2 needs gross
    period_for_cpp2 = max(gross_pay - period_exemption, Decimal("0"))
    new_ytd_gross = (
        ytd_pensionable_earnings + period_for_cpp2
        if ytd_above_ympe_before == 0
        else ytd_above_ympe_before + max_contributory + period_for_cpp2
    )
    ytd_above_ympe_after = max(new_ytd_gross - max_contributory, Decimal("0"))
    ytd_above_ympe_after = min(ytd_above_ympe_after, cpp2_band_max)

    period_cpp2_earnings = max(
        ytd_above_ympe_after - ytd_above_ympe_before, Decimal("0")
    )

    if period_cpp2_earnings > 0:
        cpp2_amount = _q(period_cpp2_earnings * CPP2_RATE)

    return (cpp_amount, cpp2_amount, new_ytd)
