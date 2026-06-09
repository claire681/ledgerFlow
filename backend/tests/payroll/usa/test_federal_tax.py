"""Unit tests for US federal income tax."""
from decimal import Decimal
import pytest
from app.payroll.engines.usa.federal_tax import calculate_federal_tax


def test_under_std_deduction_zero():
    """Annual under standard deduction = no tax."""
    tax = calculate_federal_tax(
        gross_pay=Decimal("500.00"),
        pay_periods_per_year=26,
        filing_status="single",
    )
    # annual 13000 < std deduction 15000
    assert tax == Decimal("0")


def test_single_biweekly_basic():
    """Single, 2400 biweekly, no dependents."""
    tax = calculate_federal_tax(
        gross_pay=Decimal("2400.00"),
        pay_periods_per_year=26,
        filing_status="single",
    )
    # annual = 62400, std ded 15000, taxable 47400
    # 11925 * 0.10 = 1192.50
    # (47400-11925)=35475 * 0.12 = 4257.00
    # total annual 5449.50 / 26 = 209.60
    assert tax == Decimal("209.60")


def test_dependents_credit_reduces_tax():
    """Two qualifying children = 4000 credit."""
    no_kids = calculate_federal_tax(
        gross_pay=Decimal("2400.00"),
        pay_periods_per_year=26,
    )
    two_kids = calculate_federal_tax(
        gross_pay=Decimal("2400.00"),
        pay_periods_per_year=26,
        qualifying_children=2,
    )
    # credit = 4000 / 26 = 153.85
    assert two_kids == no_kids - Decimal("153.85")


def test_mfj_lower_tax_than_single():
    """MFJ widens brackets - lower tax for same income."""
    single = calculate_federal_tax(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=26,
        filing_status="single",
    )
    mfj = calculate_federal_tax(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=26,
        filing_status="married_filing_jointly",
    )
    assert mfj < single


def test_additional_withholding_adds():
    base = calculate_federal_tax(
        gross_pay=Decimal("2400.00"),
        pay_periods_per_year=26,
    )
    extra = calculate_federal_tax(
        gross_pay=Decimal("2400.00"),
        pay_periods_per_year=26,
        additional_withholding=Decimal("50"),
    )
    assert extra == base + Decimal("50.00")
