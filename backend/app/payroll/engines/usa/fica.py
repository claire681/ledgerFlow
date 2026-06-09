"""US FICA: Social Security + Medicare + Additional Medicare Tax, 2026.

Reference: SSA wage base, IRS Publication 15.

2026 figures (placeholder; verify SSA publication):
- SS wage base: 181,000
- SS rate: 6.2 percent (employee and employer each)
- Medicare rate: 1.45 percent (employee and employer each, no wage cap)
- Additional Medicare Tax: 0.9 percent on wages above 200,000 YTD (employee only)
  Note: withholding threshold is flat 200,000 regardless of filing status.

Pure function. Employer matches SS and Medicare exactly. Additional Medicare
is employee only.
"""

from decimal import Decimal, ROUND_HALF_UP


SS_WAGE_BASE_2026 = Decimal("181000.00")
SS_RATE = Decimal("0.062")
MEDICARE_RATE = Decimal("0.0145")
ADDITIONAL_MEDICARE_RATE = Decimal("0.009")
ADDITIONAL_MEDICARE_THRESHOLD = Decimal("200000.00")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_fica(
    gross_pay: Decimal,
    ytd_ss_wages: Decimal,
    ytd_medicare_wages: Decimal,
    fica_exempt: bool = False,
) -> dict:
    """Calculate all FICA components.

    Returns dict with: ss_employee, ss_employer, medicare_employee,
    medicare_employer, additional_medicare, new_ytd_ss, new_ytd_medicare.
    """
    if fica_exempt:
        return {
            "ss_employee": Decimal("0"),
            "ss_employer": Decimal("0"),
            "medicare_employee": Decimal("0"),
            "medicare_employer": Decimal("0"),
            "additional_medicare": Decimal("0"),
            "new_ytd_ss": ytd_ss_wages,
            "new_ytd_medicare": ytd_medicare_wages,
        }

    # Social Security (wage-base capped)
    ss_period_wages = gross_pay
    if ytd_ss_wages + ss_period_wages > SS_WAGE_BASE_2026:
        ss_period_wages = max(SS_WAGE_BASE_2026 - ytd_ss_wages, Decimal("0"))
    ss_employee = _q(ss_period_wages * SS_RATE)
    ss_employer = ss_employee
    new_ytd_ss = ytd_ss_wages + ss_period_wages

    # Medicare (no cap)
    medicare_employee = _q(gross_pay * MEDICARE_RATE)
    medicare_employer = medicare_employee
    new_ytd_medicare = ytd_medicare_wages + gross_pay

    # Additional Medicare on wages above 200K YTD
    additional_medicare = Decimal("0")
    if new_ytd_medicare > ADDITIONAL_MEDICARE_THRESHOLD:
        ytd_above_before = max(
            ytd_medicare_wages - ADDITIONAL_MEDICARE_THRESHOLD, Decimal("0")
        )
        ytd_above_after = new_ytd_medicare - ADDITIONAL_MEDICARE_THRESHOLD
        period_above = ytd_above_after - ytd_above_before
        additional_medicare = _q(period_above * ADDITIONAL_MEDICARE_RATE)

    return {
        "ss_employee": ss_employee,
        "ss_employer": ss_employer,
        "medicare_employee": medicare_employee,
        "medicare_employer": medicare_employer,
        "additional_medicare": additional_medicare,
        "new_ytd_ss": new_ytd_ss,
        "new_ytd_medicare": new_ytd_medicare,
    }
