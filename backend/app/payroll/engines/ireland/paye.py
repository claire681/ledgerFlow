"""Irish PAYE income tax, 2026.

Reference: Revenue.ie PAYE manual, Budget 2025 figures (placeholder for 2026).

Two-rate system:
- Standard rate (20 percent) up to the Standard Rate Cut-Off Point (SRCOP)
- Higher rate (40 percent) above SRCOP

SRCOP 2025 (placeholder for 2026):
- Single / widowed / surviving civil partner without dependent children: 44,000
- Single parent / surviving civil partner with dependent children: 53,000
- Married / civil partner (one earner): 53,000
- Married / civil partner (both earners): up to 88,000 (transferable)

Tax credits (reduce tax DIRECTLY, not taxable income):
- Personal Tax Credit: 2,000 (single) / 4,000 (married jointly)
- Employee Tax Credit (PAYE credit): 2,000 (most employees)
- Single Person Child Carer Credit: 1,750 if qualifying

v1: annualized method. Production should use cumulative method per Revenue.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional


STANDARD_RATE = Decimal("0.20")
HIGHER_RATE = Decimal("0.40")

SRCOP_SINGLE = Decimal("44000.00")
SRCOP_SINGLE_PARENT = Decimal("53000.00")
SRCOP_MARRIED_ONE_EARNER = Decimal("53000.00")
SRCOP_MARRIED_TWO_EARNERS = Decimal("88000.00")  # transferable

PERSONAL_CREDIT_SINGLE = Decimal("2000.00")
PERSONAL_CREDIT_MARRIED = Decimal("4000.00")
EMPLOYEE_CREDIT = Decimal("2000.00")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_paye(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    srcop_annual: Optional[Decimal] = None,
    annual_tax_credits: Optional[Decimal] = None,
    additional_withholding: Decimal = Decimal("0"),
) -> Decimal:
    """Calculate Irish PAYE for one pay period (annualized).

    Args:
        gross_pay: Taxable earnings this period.
        pay_periods_per_year: 12, 26, 52.
        srcop_annual: Standard Rate Cut-Off Point. Default = single 44,000.
        annual_tax_credits: Total tax credits per year. Default = single
            (Personal 2,000 + Employee 2,000 = 4,000).
        additional_withholding: Manual extra per period.
    """
    if srcop_annual is None:
        srcop_annual = SRCOP_SINGLE
    if annual_tax_credits is None:
        annual_tax_credits = PERSONAL_CREDIT_SINGLE + EMPLOYEE_CREDIT

    annual_gross = gross_pay * Decimal(pay_periods_per_year)

    standard_rate_band = min(annual_gross, srcop_annual)
    higher_rate_band = max(annual_gross - srcop_annual, Decimal("0"))

    annual_tax = (
        standard_rate_band * STANDARD_RATE
        + higher_rate_band * HIGHER_RATE
    )

    # Tax credits reduce tax directly (NOT taxable income)
    annual_tax = max(annual_tax - annual_tax_credits, Decimal("0"))

    period_tax = _q(annual_tax / Decimal(pay_periods_per_year))
    return period_tax + additional_withholding
