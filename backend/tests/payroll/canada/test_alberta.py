"""Unit tests for Alberta provincial income tax."""

from decimal import Decimal
import pytest

from app.payroll.engines.canada.alberta import (
    calculate_alberta_tax,
    BPA_AB_2026,
)


def test_under_bpa_returns_zero():
    """Annual income below Alberta BPA = zero tax."""
    # 800 biweekly = annual 20800 < BPA 21003
    tax = calculate_alberta_tax(
        gross_pay=Decimal("800.00"),
        pay_periods_per_year=26,
    )
    assert tax == Decimal("0")


def test_first_bracket():
    """Biweekly 2000 = annual 52000, in 10 percent bracket."""
    tax = calculate_alberta_tax(
        gross_pay=Decimal("2000.00"),
        pay_periods_per_year=26,
    )
    # annual tax = 52000 * 0.10 = 5200
    # credit = 21003 * 0.10 = 2100.30
    # net annual = 3099.70
    # period = 3099.70 / 26 = 119.22
    assert tax == Decimal("119.22")


def test_crossing_into_second_bracket():
    """Annual ~160000 = first bracket full + small amount in 12 percent."""
    tax = calculate_alberta_tax(
        gross_pay=Decimal("6153.85"),
        pay_periods_per_year=26,
    )
    # annual = 160000.10
    # tax on 148269 at 10 percent = 14826.90
    # tax on (160000.10 - 148269 = 11731.10) at 12 percent = 1407.732
    # total = 16234.632
    # credit = 21003 * 0.10 = 2100.30
    # net annual = 14134.332
    # period = 14134.332 / 26 = 543.6281... rounded = 543.63
    assert tax == Decimal("543.63")


def test_custom_td1_claim():
    """Higher TD1 claim lowers tax."""
    tax_basic = calculate_alberta_tax(
        gross_pay=Decimal("2000.00"),
        pay_periods_per_year=26,
        td1_provincial_claim=BPA_AB_2026,
    )
    tax_higher = calculate_alberta_tax(
        gross_pay=Decimal("2000.00"),
        pay_periods_per_year=26,
        td1_provincial_claim=Decimal("30000"),
    )
    assert tax_higher < tax_basic
