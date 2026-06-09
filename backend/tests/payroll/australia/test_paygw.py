"""Unit tests for Australian PAYG withholding."""
from decimal import Decimal
import pytest
from app.payroll.engines.australia.paygw import calculate_paygw


def test_under_threshold_zero():
    """Annual under 18200 = zero tax (claim threshold)."""
    # Monthly 1000 = annual 12000
    tax = calculate_paygw(
        gross_pay=Decimal("1000.00"),
        pay_periods_per_year=12,
        tax_free_threshold_claimed=True,
    )
    assert tax == Decimal("0")


def test_in_16_percent_bracket():
    """Annual 30000 = 11800 taxable at 16 percent."""
    tax = calculate_paygw(
        gross_pay=Decimal("2500.00"),
        pay_periods_per_year=12,
    )
    # annual 30000, taxable 30000-18200 = 11800
    # tax = 11800 * 0.16 = 1888 / 12 = 157.33
    assert tax == Decimal("157.33")


def test_crossing_45k_bracket():
    """Annual 60000 = 26800 at 16 percent + 15000 at 30 percent."""
    tax = calculate_paygw(
        gross_pay=Decimal("5000.00"),
        pay_periods_per_year=12,
    )
    # annual 60000, taxable 41800
    # first band 26800 at 16 percent = 4288
    # next band (41800 - 26800 = 15000) at 30 percent = 4500
    # total = 8788 / 12 = 732.33
    assert tax == Decimal("732.33")


def test_no_threshold_claimed_higher_tax():
    """Same income, no threshold = more tax."""
    with_threshold = calculate_paygw(
        gross_pay=Decimal("2500.00"),
        pay_periods_per_year=12,
        tax_free_threshold_claimed=True,
    )
    without = calculate_paygw(
        gross_pay=Decimal("2500.00"),
        pay_periods_per_year=12,
        tax_free_threshold_claimed=False,
    )
    assert without > with_threshold


def test_no_tfn_flat_47_percent():
    """No TFN = flat 47 percent withholding."""
    tax = calculate_paygw(
        gross_pay=Decimal("1000.00"),
        pay_periods_per_year=12,
        has_tfn=False,
    )
    assert tax == Decimal("470.00")
