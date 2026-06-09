"""Unit tests for US FICA."""
from decimal import Decimal
import pytest
from app.payroll.engines.usa.fica import calculate_fica


def test_basic_fica():
    """2400 gross, no YTD."""
    r = calculate_fica(
        gross_pay=Decimal("2400.00"),
        ytd_ss_wages=Decimal("0"),
        ytd_medicare_wages=Decimal("0"),
    )
    # SS: 2400 * 0.062 = 148.80
    assert r["ss_employee"] == Decimal("148.80")
    assert r["ss_employer"] == Decimal("148.80")
    # Medicare: 2400 * 0.0145 = 34.80
    assert r["medicare_employee"] == Decimal("34.80")
    assert r["medicare_employer"] == Decimal("34.80")
    # No additional medicare (under 200k)
    assert r["additional_medicare"] == Decimal("0")
    assert r["new_ytd_ss"] == Decimal("2400")
    assert r["new_ytd_medicare"] == Decimal("2400")


def test_ss_wage_base_cap():
    """At SS wage base, SS stops."""
    r = calculate_fica(
        gross_pay=Decimal("10000.00"),
        ytd_ss_wages=Decimal("180000.00"),
        ytd_medicare_wages=Decimal("180000.00"),
    )
    # Only 1000 more wages until 181000 cap
    # 1000 * 0.062 = 62.00
    assert r["ss_employee"] == Decimal("62.00")
    # Medicare uncapped: 10000 * 0.0145 = 145.00
    assert r["medicare_employee"] == Decimal("145.00")


def test_additional_medicare_above_200k():
    """Additional 0.9 percent kicks in above 200k YTD."""
    r = calculate_fica(
        gross_pay=Decimal("10000.00"),
        ytd_ss_wages=Decimal("181000.00"),  # SS already capped
        ytd_medicare_wages=Decimal("195000.00"),
    )
    # Medicare: 10000 * 0.0145 = 145.00
    # New ytd medicare = 205000, threshold 200000
    # Period above = 205000 - 200000 = 5000 (since prev YTD was below)
    # Additional = 5000 * 0.009 = 45.00
    assert r["additional_medicare"] == Decimal("45.00")


def test_fica_exempt():
    r = calculate_fica(
        gross_pay=Decimal("2400.00"),
        ytd_ss_wages=Decimal("0"),
        ytd_medicare_wages=Decimal("0"),
        fica_exempt=True,
    )
    assert r["ss_employee"] == Decimal("0")
    assert r["medicare_employee"] == Decimal("0")
