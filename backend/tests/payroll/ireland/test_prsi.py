"""Unit tests for Irish PRSI."""
from decimal import Decimal
from app.payroll.engines.ireland.prsi import calculate_prsi


def test_basic_prsi():
    """Monthly 3000 = annual 36000 > threshold, employer high rate."""
    emp, er = calculate_prsi(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=12,
    )
    # Employee: 3000 * 0.041 = 123.00
    assert emp == Decimal("123.00")
    # Employer: annual 36000 > 22932 threshold, high rate
    # 3000 * 0.1115 = 334.50
    assert er == Decimal("334.50")


def test_low_earner_employer_low_rate():
    """Low annual earnings use employer low rate."""
    emp, er = calculate_prsi(
        gross_pay=Decimal("1500.00"),
        pay_periods_per_year=12,
    )
    # Annual 18000 < 22932, employer low rate
    # Employee: 1500 * 0.041 = 61.50
    # Employer: 1500 * 0.089 = 133.50
    assert emp == Decimal("61.50")
    assert er == Decimal("133.50")
