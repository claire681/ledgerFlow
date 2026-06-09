"""Unit tests for CPP calculation against known reference cases."""

from decimal import Decimal
import pytest

from app.payroll.engines.canada.cpp import calculate_cpp


def test_basic_biweekly_full_year_no_ytd():
    """Average-ish biweekly pay, start of year (no YTD), normal employee."""
    cpp, cpp2, new_ytd = calculate_cpp(
        gross_pay=Decimal("2000.00"),
        ytd_pensionable_earnings=Decimal("0"),
        pay_periods_per_year=26,
        cpp_exempt=False,
        province="AB",
    )
    # period exemption = 3500 / 26 = 134.62
    # contributory = 2000 - 134.62 = 1865.38
    # cpp = 1865.38 * 0.0595 = 110.99
    assert cpp == Decimal("110.99")
    assert cpp2 == Decimal("0")
    assert new_ytd == Decimal("1865.38")


def test_cpp_exempt_returns_zero():
    cpp, cpp2, new_ytd = calculate_cpp(
        gross_pay=Decimal("5000.00"),
        ytd_pensionable_earnings=Decimal("10000"),
        pay_periods_per_year=26,
        cpp_exempt=True,
    )
    assert cpp == Decimal("0")
    assert cpp2 == Decimal("0")
    assert new_ytd == Decimal("10000")


def test_quebec_returns_zero():
    """QC employees use QPP, handled by separate module."""
    cpp, cpp2, new_ytd = calculate_cpp(
        gross_pay=Decimal("2000.00"),
        ytd_pensionable_earnings=Decimal("0"),
        pay_periods_per_year=26,
        province="QC",
    )
    assert cpp == Decimal("0")
    assert cpp2 == Decimal("0")


def test_ympe_cap_partial_period():
    """Employee at YMPE-exemption boundary, only part of period contributes."""
    # max_contributory = 71300 - 3500 = 67800
    # ytd already 67500, so only 300 more contributable
    cpp, cpp2, new_ytd = calculate_cpp(
        gross_pay=Decimal("2000.00"),
        ytd_pensionable_earnings=Decimal("67500.00"),
        pay_periods_per_year=26,
        province="AB",
    )
    # period_exemption = 134.62
    # raw period_pensionable = 1865.38 but capped at 67800-67500 = 300
    # cpp = 300 * 0.0595 = 17.85
    assert cpp == Decimal("17.85")
    assert new_ytd == Decimal("67800.00")


def test_above_ympe_triggers_cpp2():
    """Once YMPE is exceeded, CPP2 kicks in on the band up to YAMPE."""
    # ytd already at max_contributory (67800), so all CPP1 paid up
    cpp, cpp2, new_ytd = calculate_cpp(
        gross_pay=Decimal("2000.00"),
        ytd_pensionable_earnings=Decimal("67800.00"),
        pay_periods_per_year=26,
        province="AB",
    )
    # cpp1 = 0 (capped)
    # cpp2: period_for_cpp2 = 2000 - 134.62 = 1865.38
    # cpp2_amount = 1865.38 * 0.04 = 74.62 (approx, assuming within band)
    assert cpp == Decimal("0")
    assert cpp2 > Decimal("0")
    assert cpp2 <= Decimal("75.00")
