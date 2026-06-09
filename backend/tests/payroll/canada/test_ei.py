"""Unit tests for EI calculation."""

from decimal import Decimal
import pytest

from app.payroll.engines.canada.ei import calculate_ei


def test_basic_biweekly():
    """Biweekly 2000 gross, no YTD, normal employee."""
    ei_emp, ei_er, new_ytd = calculate_ei(
        gross_pay=Decimal("2000.00"),
        ytd_insurable_earnings=Decimal("0"),
        ei_exempt=False,
    )
    # 2000 * 0.0166 = 33.20
    assert ei_emp == Decimal("33.20")
    # 33.20 * 1.4 = 46.48
    assert ei_er == Decimal("46.48")
    assert new_ytd == Decimal("2000.00")


def test_ei_exempt_returns_zero():
    ei_emp, ei_er, new_ytd = calculate_ei(
        gross_pay=Decimal("5000.00"),
        ytd_insurable_earnings=Decimal("10000"),
        ei_exempt=True,
    )
    assert ei_emp == Decimal("0")
    assert ei_er == Decimal("0")
    assert new_ytd == Decimal("10000")


def test_at_mie_cap_partial_period():
    """Employee near MIE, only part of period is insurable."""
    # MIE = 65700, ytd already 65500, only 200 more insurable
    ei_emp, ei_er, new_ytd = calculate_ei(
        gross_pay=Decimal("2000.00"),
        ytd_insurable_earnings=Decimal("65500.00"),
    )
    # 200 * 0.0166 = 3.32
    assert ei_emp == Decimal("3.32")
    assert ei_er == Decimal("4.65")
    assert new_ytd == Decimal("65700.00")


def test_above_mie_zero():
    """YTD already at MIE, no more EI."""
    ei_emp, ei_er, new_ytd = calculate_ei(
        gross_pay=Decimal("2000.00"),
        ytd_insurable_earnings=Decimal("65700.00"),
    )
    assert ei_emp == Decimal("0")
    assert ei_er == Decimal("0")
    assert new_ytd == Decimal("65700.00")


def test_employer_is_140pct_employee():
    """Employer EI is always 1.4x employee."""
    ei_emp, ei_er, _ = calculate_ei(
        gross_pay=Decimal("1000.00"),
        ytd_insurable_earnings=Decimal("0"),
    )
    assert ei_er == (ei_emp * Decimal("1.40")).quantize(Decimal("0.01"))
