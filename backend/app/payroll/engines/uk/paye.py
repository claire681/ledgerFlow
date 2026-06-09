"""UK PAYE income tax, 2026/27.

Reference: HMRC income tax bands.

v1 uses the annualized method (annualize gross, apply bands, divide back).
v2 should use the cumulative method per HMRC's official PAYE tables.

2025/26 figures (placeholders for 2026/27):
- Personal Allowance: 12,570 (frozen since 2021/22)
- Basic rate: 20 percent on next 37,700  (so up to 50,270 total)
- Higher rate: 40 percent on next 74,870 (so up to 125,140 total)
- Additional rate: 45 percent above 125,140

Tax codes:
- 1257L = standard personal allowance 12,570
- 1100L = reduced allowance 11,000 (e.g., due to benefits)
- BR    = basic rate (no allowance, 20 percent flat) - not handled in v1
- D0    = higher rate (40 percent flat) - not handled in v1
- NT    = no tax - not handled in v1
- K475  = negative allowance (added to taxable) - not handled in v1

Pure function. Scotland uses different bands (separate module in v2).
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Optional


# 2026/27 personal allowance default
PERSONAL_ALLOWANCE_DEFAULT = Decimal("12570.00")

# Bands as (upper_bound_above_allowance, rate)
# None means open top
BANDS_2026: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("37700.00"), Decimal("0.20")),
    (Decimal("112570.00"), Decimal("0.40")),  # 37700 + 74870
    (None, Decimal("0.45")),
]


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def parse_tax_code(tax_code: Optional[str]) -> Decimal:
    """Parse a simple UK tax code (e.g., '1257L') to annual personal allowance.

    v1 supports standard numeric codes only. K, NT, BR, D0 codes return
    the default allowance and need special handling later.
    """
    if not tax_code:
        return PERSONAL_ALLOWANCE_DEFAULT
    digits = "".join(c for c in tax_code if c.isdigit())
    if not digits:
        return PERSONAL_ALLOWANCE_DEFAULT
    return Decimal(digits) * 10


def _annual_tax(annual_taxable: Decimal) -> Decimal:
    """Apply progressive PAYE bands to taxable income (post-allowance)."""
    if annual_taxable <= 0:
        return Decimal("0")
    tax = Decimal("0")
    remaining = annual_taxable
    prev_top = Decimal("0")
    for top, rate in BANDS_2026:
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


def calculate_paye(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    tax_code: Optional[str] = "1257L",
    additional_withholding: Decimal = Decimal("0"),
) -> Decimal:
    """Calculate PAYE income tax for one pay period (annualized method).

    Args:
        gross_pay: Taxable earnings this period.
        pay_periods_per_year: 12, 13, 26, 52.
        tax_code: UK tax code (e.g., '1257L'). Default is standard 1257L.
        additional_withholding: Manual extra per period.

    Returns:
        PAYE tax to withhold this period.
    """
    personal_allowance = parse_tax_code(tax_code)

    annual_gross = gross_pay * Decimal(pay_periods_per_year)
    annual_taxable = max(annual_gross - personal_allowance, Decimal("0"))
    annual_tax = _annual_tax(annual_taxable)

    period_tax = _q(annual_tax / Decimal(pay_periods_per_year))
    period_tax += additional_withholding

    return period_tax
