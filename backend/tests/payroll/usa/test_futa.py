"""Unit tests for FUTA."""
from decimal import Decimal
from app.payroll.engines.usa.futa import calculate_futa


def test_basic_futa():
    """First period of year, full wages count."""
    futa, new_ytd = calculate_futa(
        gross_pay=Decimal("2400.00"),
        ytd_futa_wages=Decimal("0"),
    )
    # 2400 * 0.006 = 14.40
    assert futa == Decimal("14.40")
    assert new_ytd == Decimal("2400.00")


def test_futa_wage_base_cap():
    """Once 7000 reached, FUTA stops."""
    futa, _ = calculate_futa(
        gross_pay=Decimal("2400.00"),
        ytd_futa_wages=Decimal("7000.00"),
    )
    assert futa == Decimal("0")


def test_futa_partial_at_cap():
    """At YTD 6000, only 1000 of period counts."""
    futa, new_ytd = calculate_futa(
        gross_pay=Decimal("2400.00"),
        ytd_futa_wages=Decimal("6000.00"),
    )
    # only 1000 counts: 1000 * 0.006 = 6.00
    assert futa == Decimal("6.00")
    assert new_ytd == Decimal("7000.00")
