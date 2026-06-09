"""Irish Universal Social Charge (USC), 2026.

Reference: Revenue.ie USC rates.

2025 figures (placeholder for 2026):
- 0.5 percent on first 12,012
- 2.0 percent on 12,012 to 27,382
- 3.0 percent on 27,382 to 70,044 (reduced from 4 percent in Budget 2025)
- 8.0 percent above 70,044

Exemption: total income <= 13,000 per year (no USC at all).

Reduced rates for medical card holders and over-70s with income <= 60,000:
- 0.5 percent on first 12,012, 2 percent above (no 3 percent or 8 percent bands)
- Not handled in v1.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Optional


USC_BANDS_2026: List[Tuple[Optional[Decimal], Decimal]] = [
    (Decimal("12012.00"), Decimal("0.005")),
    (Decimal("27382.00"), Decimal("0.02")),
    (Decimal("70044.00"), Decimal("0.03")),
    (None, Decimal("0.08")),
]

USC_EXEMPTION_THRESHOLD = Decimal("13000.00")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _annual_usc(annual_gross: Decimal) -> Decimal:
    if annual_gross <= USC_EXEMPTION_THRESHOLD:
        return Decimal("0")
    tax = Decimal("0")
    remaining = annual_gross
    prev_top = Decimal("0")
    for top, rate in USC_BANDS_2026:
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


def calculate_usc(
    gross_pay: Decimal,
    pay_periods_per_year: int,
    exempt: bool = False,
) -> Decimal:
    """Calculate USC for one pay period."""
    if exempt:
        return Decimal("0")
    annual_gross = gross_pay * Decimal(pay_periods_per_year)
    annual_usc = _annual_usc(annual_gross)
    return _q(annual_usc / Decimal(pay_periods_per_year))
