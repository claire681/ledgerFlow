"""Australian Superannuation Guarantee (employer contribution), 2026-27.

Reference: ATO Super Guarantee rate and Maximum Contribution Base.

2026-27 (and ongoing):
- Super Guarantee rate: 12 percent (reached full rate in July 2025)
- Applies to Ordinary Time Earnings (OTE), NOT overtime
- Maximum Contribution Base: per-quarter cap on OTE that attracts super
  (2025-26 was ~65,070 per quarter; placeholder pending 2026-27 publication)

Employer-only contribution; no employee deduction here.
"""

from decimal import Decimal, ROUND_HALF_UP


SUPER_RATE = Decimal("0.12")

# Per-quarter maximum contribution base (placeholder; verify 2026-27)
MCB_QUARTERLY_2026 = Decimal("65070.00")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_super(
    ote_pay: Decimal,
    pay_periods_per_year: int,
) -> Decimal:
    """Calculate employer super contribution for one pay period.

    Args:
        ote_pay: Ordinary Time Earnings this period (gross minus overtime).
        pay_periods_per_year: 12, 26, 52.

    Returns:
        Employer super contribution.
    """
    if ote_pay <= 0:
        return Decimal("0")

    # Convert per-quarter MCB to per-period
    # 4 quarters per year. Per-period MCB = (MCB * 4) / pay_periods_per_year
    period_mcb = (MCB_QUARTERLY_2026 * Decimal("4")) / Decimal(pay_periods_per_year)

    capped_ote = min(ote_pay, period_mcb)
    return _q(capped_ote * SUPER_RATE)
