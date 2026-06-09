"""Unit tests for Irish PAYE."""
from decimal import Decimal
import pytest
from app.payroll.engines.ireland.paye import (
    calculate_paye,
    SRCOP_SINGLE,
    PERSONAL_CREDIT_SINGLE,
    EMPLOYEE_CREDIT,
)


def test_single_under_srcop():
    """Monthly 3000 = annual 36000, all in 20 percent band."""
    tax = calculate_paye(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=12,
    )
    # annual = 36000 * 0.20 = 7200
    # credits = 2000 + 2000 = 4000
    # net annual = 3200 / 12 = 266.67
    assert tax == Decimal("266.67")


def test_under_credits_zero_tax():
    """Annual under tax credits = no tax."""
    # Annual 18000, tax = 18000 * 0.20 = 3600
    # Credits = 4000 > 3600 = zero tax
    tax = calculate_paye(
        gross_pay=Decimal("1500.00"),
        pay_periods_per_year=12,
    )
    assert tax == Decimal("0")


def test_crossing_srcop_higher_rate():
    """Monthly 5000 = annual 60000, crosses SRCOP into 40 percent."""
    tax = calculate_paye(
        gross_pay=Decimal("5000.00"),
        pay_periods_per_year=12,
    )
    # annual 60000
    # standard band 44000 * 0.20 = 8800
    # higher band (60000-44000)=16000 * 0.40 = 6400
    # total 15200, credits 4000, net 11200 / 12 = 933.33
    assert tax == Decimal("933.33")


def test_married_higher_srcop():
    """Married SRCOP 53000 with 4000 credits."""
    tax = calculate_paye(
        gross_pay=Decimal("5000.00"),
        pay_periods_per_year=12,
        srcop_annual=Decimal("53000.00"),
        annual_tax_credits=Decimal("4000.00"),
    )
    # annual 60000
    # standard 53000 * 0.20 = 10600
    # higher (60000-53000)=7000 * 0.40 = 2800
    # total 13400, credits 4000, net 9400 / 12 = 783.33
    assert tax == Decimal("783.33")
