"""Unit tests for Australian Medicare Levy."""
from decimal import Decimal
from app.payroll.engines.australia.medicare_levy import calculate_medicare_levy


def test_under_threshold_zero():
    """Annual under threshold = 0."""
    levy = calculate_medicare_levy(
        gross_pay=Decimal("2500.00"),
        pay_periods_per_year=12,
    )
    # annual 30000 < 34027
    assert levy == Decimal("0")


def test_above_threshold_2_percent():
    """Annual above 34027 = full 2 percent."""
    levy = calculate_medicare_levy(
        gross_pay=Decimal("5000.00"),
        pay_periods_per_year=12,
    )
    # annual 60000 * 0.02 = 1200 / 12 = 100
    assert levy == Decimal("100.00")


def test_exempt_returns_zero():
    levy = calculate_medicare_levy(
        gross_pay=Decimal("5000.00"),
        pay_periods_per_year=12,
        exempt=True,
    )
    assert levy == Decimal("0")
