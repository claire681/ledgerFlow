"""Unit tests for Australian Superannuation."""
from decimal import Decimal
from app.payroll.engines.australia.super import calculate_super


def test_basic_super_12_percent():
    """Monthly 5000 OTE = 600 super."""
    s = calculate_super(
        ote_pay=Decimal("5000.00"),
        pay_periods_per_year=12,
    )
    # 5000 * 0.12 = 600
    assert s == Decimal("600.00")


def test_zero_ote_zero_super():
    s = calculate_super(
        ote_pay=Decimal("0"),
        pay_periods_per_year=12,
    )
    assert s == Decimal("0")


def test_max_contribution_base_cap():
    """At MCB cap, super is capped."""
    # MCB per period (monthly) = 65070 * 4 / 12 = 21690
    # OTE 30000 > MCB 21690, so super = 21690 * 0.12 = 2602.80
    s = calculate_super(
        ote_pay=Decimal("30000.00"),
        pay_periods_per_year=12,
    )
    assert s == Decimal("2602.80")
