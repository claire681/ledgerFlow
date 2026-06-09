"""Unit tests for US state tax modules."""
from decimal import Decimal
import pytest
from app.payroll.engines.usa.states import california, illinois, texas


def test_california_basic():
    """CA single, 2400 biweekly."""
    tax = california.calculate_california_tax(
        gross_pay=Decimal("2400.00"),
        pay_periods_per_year=26,
        filing_status="single",
    )
    # annual 62400, std ded 5540, taxable 56860
    # 10756 * 0.01 = 107.56
    # (25499-10756)=14743 * 0.02 = 294.86
    # (40245-25499)=14746 * 0.04 = 589.84
    # (55866-40245)=15621 * 0.06 = 937.26
    # (56860-55866)=994 * 0.08 = 79.52
    # total = 2009.04 / 26 = 77.27
    assert tax == Decimal("77.27")


def test_illinois_flat_rate():
    """IL flat 4.95 percent."""
    tax = illinois.calculate_illinois_tax(
        gross_pay=Decimal("2400.00"),
        pay_periods_per_year=26,
        allowances=1,
    )
    # annual 62400, exemption 2775, taxable 59625
    # tax = 59625 * 0.0495 = 2951.4375 / 26 = 113.52
    assert tax == Decimal("113.52")


def test_texas_zero():
    tax = texas.calculate_texas_tax(
        gross_pay=Decimal("5000.00"),
        pay_periods_per_year=26,
    )
    assert tax == Decimal("0")


def test_california_mfj_lower_tax():
    single = california.calculate_california_tax(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=26,
        filing_status="single",
    )
    mfj = california.calculate_california_tax(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=26,
        filing_status="married_filing_jointly",
    )
    assert mfj < single
