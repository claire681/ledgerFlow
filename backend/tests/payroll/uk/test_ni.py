"""Unit tests for UK National Insurance (Category A)."""

from decimal import Decimal
import pytest

from app.payroll.engines.uk.ni import (
    calculate_ni_category_a,
    PT_ANNUAL,
    UEL_ANNUAL,
    ST_ANNUAL,
)


def test_under_pt_zero_employee_ni():
    """Below Primary Threshold = no employee NI."""
    # Monthly 1000, annual 12000 < PT 12570
    ni_emp, ni_er = calculate_ni_category_a(
        gross_pay=Decimal("1000.00"),
        pay_periods_per_year=12,
    )
    assert ni_emp == Decimal("0")
    # Employer NI: 1000 > monthly ST (5000/12 = 416.67), so 583.33 * 0.15 = 87.50
    assert ni_er == Decimal("87.50")


def test_monthly_in_main_band():
    """Monthly 3000 = above PT but below UEL."""
    ni_emp, ni_er = calculate_ni_category_a(
        gross_pay=Decimal("3000.00"),
        pay_periods_per_year=12,
    )
    # Monthly PT = 12570/12 = 1047.50
    # Main band = 3000 - 1047.50 = 1952.50
    # Employee NI = 1952.50 * 0.08 = 156.20
    assert ni_emp == Decimal("156.20")
    # Monthly ST = 5000/12 = 416.67
    # Employer NI = (3000 - 416.67) * 0.15 = 387.50
    assert ni_er == Decimal("387.50")


def test_monthly_above_uel():
    """Monthly 5000, above UEL (4189.17)."""
    ni_emp, ni_er = calculate_ni_category_a(
        gross_pay=Decimal("5000.00"),
        pay_periods_per_year=12,
    )
    # PT_M = 1047.50, UEL_M = 50270/12 = 4189.17
    # Main band = 4189.17 - 1047.50 = 3141.67 * 0.08 = 251.33
    # Additional = (5000 - 4189.17) * 0.02 = 810.83 * 0.02 = 16.22
    # Total employee = 267.55
    assert ni_emp == Decimal("267.55")


def test_weekly_calculation():
    """Weekly pay uses weekly thresholds."""
    ni_emp, ni_er = calculate_ni_category_a(
        gross_pay=Decimal("400.00"),
        pay_periods_per_year=52,
    )
    # Weekly PT = 12570/52 = 241.73
    # Main band = 400 - 241.73 = 158.27 * 0.08 = 12.66
    assert ni_emp == Decimal("12.66")
