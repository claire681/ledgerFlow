"""Unit tests for Irish USC."""
from decimal import Decimal
from app.payroll.engines.ireland.usc import calculate_usc


def test_under_exemption_zero():
    """Annual under 13000 = zero USC."""
    usc = calculate_usc(
        gross_pay=Decimal("1000.00"),
        pay_periods_per_year=12,
    )
    # annual 12000 < 13000 exemption
    assert usc == Decimal("0")


def test_in_lower_bands():
    """Monthly 3000 = annual 36000."""
    usc = calculate_usc(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=12,
    )
    # band 1: 12012 * 0.005 = 60.06
    # band 2: (27382-12012)=15370 * 0.02 = 307.40
    # band 3: (36000-27382)=8618 * 0.03 = 258.54
    # total annual 626.00 / 12 = 52.17
    assert usc == Decimal("52.17")


def test_above_higher_band():
    """Monthly 7000 = annual 84000, crosses 70044 into 8 percent."""
    usc = calculate_usc(
        gross_pay=Decimal("7000.00"),
        pay_periods_per_year=12,
    )
    # band 1: 60.06
    # band 2: 307.40
    # band 3: (70044-27382)=42662 * 0.03 = 1279.86
    # band 4: (84000-70044)=13956 * 0.08 = 1116.48
    # total 2763.80 / 12 = 230.32
    assert usc == Decimal("230.32")


def test_exempt_returns_zero():
    usc = calculate_usc(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=12,
        exempt=True,
    )
    assert usc == Decimal("0")
