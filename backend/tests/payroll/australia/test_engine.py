"""Integration tests: Australia payroll engine."""
from decimal import Decimal
from datetime import date
import pytest

from app.payroll.types import (
    PayCalculationInput,
    EmployeeContext,
    EarningsInput,
    HoursWorked,
    JurisdictionContext,
    YTDContext,
)
from app.payroll.engines.australia import AustraliaPayrollEngine


def _au_monthly_input(salary=Decimal("5000.00"), tax_info=None):
    return PayCalculationInput(
        employee=EmployeeContext(
            employee_id="au-emp-1",
            tax_info=tax_info or {"claim_tax_free_threshold": True, "has_tfn": True},
        ),
        earnings=EarningsInput(
            pay_type="salary",
            salary_amount=salary,
        ),
        jurisdiction=JurisdictionContext(
            country="AU",
            pay_period_start=date(2026, 7, 1),
            pay_period_end=date(2026, 7, 31),
            pay_date=date(2026, 8, 2),
            pay_periods_per_year=12,
        ),
        ytd=YTDContext(tax_year=2026),
    )


def test_au_monthly_basic():
    """Monthly AU resident, 5000 salary, TFN claimed."""
    result = AustraliaPayrollEngine().calculate(_au_monthly_input())

    assert result.gross_pay == Decimal("5000.00")

    # PAYG matches unit test
    assert result.federal_tax == Decimal("732.33")

    # Medicare Levy matches unit test
    assert result.local_tax == Decimal("100.00")

    # Super matches unit test
    assert result.other_employer_contributions["superannuation"] == Decimal("600.00")
    assert result.total_employer_contributions == Decimal("600.00")

    # Total employee = PAYG + Medicare = 832.33
    assert result.total_employee_deductions == Decimal("832.33")

    # Net = 5000 - 832.33 = 4167.67
    assert result.net_pay == Decimal("4167.67")


def test_au_no_tfn_high_tax():
    """No TFN = 47 percent flat withholding."""
    result = AustraliaPayrollEngine().calculate(
        _au_monthly_input(tax_info={"has_tfn": False})
    )
    # 5000 * 0.47 = 2350
    assert result.federal_tax == Decimal("2350.00")


def test_au_overtime_excluded_from_super():
    """Super calculated on OTE (gross minus overtime)."""
    input = PayCalculationInput(
        employee=EmployeeContext(
            employee_id="au-emp-ot",
            tax_info={"claim_tax_free_threshold": True, "has_tfn": True},
        ),
        earnings=EarningsInput(
            pay_type="hourly",
            hourly_rate=Decimal("30.00"),
            hours=HoursWorked(
                regular=Decimal("80"),    # 2400
                overtime=Decimal("10"),   # 10 * 30 * 1.5 = 450
            ),
        ),
        jurisdiction=JurisdictionContext(
            country="AU",
            pay_period_start=date(2026, 7, 1),
            pay_period_end=date(2026, 7, 14),
            pay_date=date(2026, 7, 16),
            pay_periods_per_year=26,
        ),
        ytd=YTDContext(tax_year=2026),
    )
    result = AustraliaPayrollEngine().calculate(input)

    # Gross = 2400 + 450 = 2850
    assert result.gross_pay == Decimal("2850.00")
    # OTE = 2400 (overtime excluded)
    # Super = 2400 * 0.12 = 288
    assert result.other_employer_contributions["superannuation"] == Decimal("288.00")


def test_au_snapshot_includes_rates():
    """Audit snapshot contains AU rates and constants."""
    result = AustraliaPayrollEngine().calculate(_au_monthly_input())
    snap = result.calculation_snapshot

    assert snap["engine"] == "AustraliaPayrollEngine v1"
    assert snap["country"] == "AU"
    assert snap["paygw"]["tax_free_threshold_claimed"] is True
    assert snap["paygw"]["has_tfn"] is True
    assert snap["medicare_levy"]["rate"] == "0.02"
    assert snap["super"]["rate"] == "0.12"
