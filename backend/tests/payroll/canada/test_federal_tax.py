"""Unit tests for federal income tax."""

from decimal import Decimal
import pytest

from app.payroll.engines.canada.federal_tax import (
    calculate_federal_tax,
    BASIC_PERSONAL_AMOUNT_2026,
    LOWEST_RATE,
)


def test_under_bpa_returns_zero():
    """Annual income below BPA = zero tax."""
    # Biweekly 500 = annual 13000 < BPA 16129
    tax = calculate_federal_tax(
        gross_pay=Decimal("500.00"),
        pay_periods_per_year=26,
    )
    assert tax == Decimal("0")


def test_first_bracket_employee():
    """Annual income squarely in first bracket."""
    # Biweekly 2000 = annual 52000 (below 55867 first bracket top)
    tax = calculate_federal_tax(
        gross_pay=Decimal("2000.00"),
        pay_periods_per_year=26,
    )
    # annual tax = 52000 * 0.15 = 7800
    # credit = 16129 * 0.15 = 2419.35
    # net annual = 7800 - 2419.35 = 5380.65
    # period = 5380.65 / 26 = 206.95
    assert tax == Decimal("206.95")


def test_crossing_first_bracket():
    """Annual income crossing 55867 into second bracket."""
    # Biweekly 3000 = annual 78000
    tax = calculate_federal_tax(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=26,
    )
    # tax on first bracket: 55867 * 0.15 = 8380.05
    # tax on (78000 - 55867 = 22133) at 0.205 = 4537.265
    # total = 12917.315
    # credit = 16129 * 0.15 = 2419.35
    # net = 10497.965 -> 10497.97 / 26 = 403.77
    assert tax == Decimal("403.77")


def test_additional_withholding_adds_directly():
    tax_base = calculate_federal_tax(
        gross_pay=Decimal("2000.00"),
        pay_periods_per_year=26,
    )
    tax_extra = calculate_federal_tax(
        gross_pay=Decimal("2000.00"),
        pay_periods_per_year=26,
        additional_withholding=Decimal("50.00"),
    )
    assert tax_extra == tax_base + Decimal("50.00")


def test_high_claim_reduces_tax():
    """Higher TD1 claim = lower tax."""
    tax_basic = calculate_federal_tax(
        gross_pay=Decimal("2000.00"),
        pay_periods_per_year=26,
        td1_federal_claim=BASIC_PERSONAL_AMOUNT_2026,
    )
    tax_high = calculate_federal_tax(
        gross_pay=Decimal("2000.00"),
        pay_periods_per_year=26,
        td1_federal_claim=Decimal("25000"),
    )
    assert tax_high < tax_basic


def test_monthly_vs_biweekly_consistent():
    """Same annual income, different pay frequencies should yield same total annual tax."""
    # Biweekly: 2000 * 26 = 52000
    # Monthly: 4333.33 * 12 = 51999.96 (close enough for test)
    annual_via_biweekly = calculate_federal_tax(
        gross_pay=Decimal("2000.00"),
        pay_periods_per_year=26,
    ) * 26
    annual_via_monthly = calculate_federal_tax(
        gross_pay=Decimal("4333.33"),
        pay_periods_per_year=12,
    ) * 12
    diff = abs(annual_via_biweekly - annual_via_monthly)
    assert diff < Decimal("5.00"), f"diff={diff}"
