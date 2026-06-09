"""Unit tests for UK PAYE income tax."""

from decimal import Decimal
import pytest

from app.payroll.engines.uk.paye import (
    calculate_paye,
    parse_tax_code,
    PERSONAL_ALLOWANCE_DEFAULT,
)


def test_parse_standard_tax_code():
    assert parse_tax_code("1257L") == Decimal("12570")
    assert parse_tax_code("1100L") == Decimal("11000")
    assert parse_tax_code(None) == PERSONAL_ALLOWANCE_DEFAULT


def test_under_personal_allowance_zero():
    """Annual 12000 < PA 12570 = no tax."""
    tax = calculate_paye(
        gross_pay=Decimal("1000.00"),
        pay_periods_per_year=12,
        tax_code="1257L",
    )
    assert tax == Decimal("0")


def test_basic_rate_employee():
    """Monthly 3000, annual 36000 = 23430 taxable at 20 percent."""
    tax = calculate_paye(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=12,
    )
    # annual gross = 36000
    # taxable = 36000 - 12570 = 23430
    # tax = 23430 * 0.20 = 4686
    # per period = 4686 / 12 = 390.50
    assert tax == Decimal("390.50")


def test_higher_rate_employee():
    """Monthly 6000 = annual 72000, crosses into 40 percent band."""
    tax = calculate_paye(
        gross_pay=Decimal("6000.00"),
        pay_periods_per_year=12,
    )
    # annual = 72000, taxable = 59430
    # band 1 (20 pct): first 37700 = 7540
    # band 2 (40 pct): 59430 - 37700 = 21730 * 0.40 = 8692
    # total annual = 16232 / 12 = 1352.67
    assert tax == Decimal("1352.67")


def test_additional_withholding():
    """Manual extra adds directly to result."""
    base = calculate_paye(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=12,
    )
    extra = calculate_paye(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=12,
        additional_withholding=Decimal("100.00"),
    )
    assert extra == base + Decimal("100.00")


def test_low_tax_code_higher_tax():
    """Lower tax code (less allowance) = more tax."""
    high_code_tax = calculate_paye(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=12,
        tax_code="1257L",
    )
    low_code_tax = calculate_paye(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=12,
        tax_code="500L",  # allowance 5000
    )
    assert low_code_tax > high_code_tax
