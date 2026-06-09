"""Integration tests: UK payroll engine end-to-end."""

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
from app.payroll.engines.uk import UKPayrollEngine


def _uk_monthly_input(salary=Decimal("3000.00"), tax_code="1257L"):
    return PayCalculationInput(
        employee=EmployeeContext(
            employee_id="uk-emp-1",
            ni_category="A",
            tax_info={"paye_tax_code": tax_code},
        ),
        earnings=EarningsInput(
            pay_type="salary",
            salary_amount=salary,
        ),
        jurisdiction=JurisdictionContext(
            country="GB",
            pay_period_start=date(2026, 4, 6),
            pay_period_end=date(2026, 5, 5),
            pay_date=date(2026, 5, 7),
            pay_periods_per_year=12,
        ),
        ytd=YTDContext(tax_year=2026),
    )


def test_uk_monthly_basic():
    """Monthly UK employee, 3000 salary, standard tax code."""
    result = UKPayrollEngine().calculate(_uk_monthly_input())

    assert result.gross_pay == Decimal("3000.00")
    # PAYE: 390.50 (matches unit test)
    assert result.federal_tax == Decimal("390.50")
    # NI employee: 156.20 (matches unit test)
    assert result.social_security_employee == Decimal("156.20")
    # NI employer: 387.50
    assert result.social_security_employer == Decimal("387.50")

    # Total employee deductions = 390.50 + 156.20 = 546.70
    assert result.total_employee_deductions == Decimal("546.70")

    # Net = 3000 - 546.70 = 2453.30
    assert result.net_pay == Decimal("2453.30")

    # No provincial / local / unemployment in UK
    assert result.provincial_or_state_tax == Decimal("0")
    assert result.unemployment_employee == Decimal("0")

    # 3 deduction lines (PAYE, NI emp, NI er)
    assert len(result.deduction_lines) == 3


def test_uk_higher_earner():
    """Monthly 6000 = crosses 40 percent band."""
    result = UKPayrollEngine().calculate(_uk_monthly_input(salary=Decimal("6000.00")))
    assert result.federal_tax == Decimal("1352.67")
    # NI: PT_M=1047.50, UEL_M=4189.17
    # main = (4189.17 - 1047.50) * 0.08 = 251.33
    # additional = (6000 - 4189.17) * 0.02 = 36.22
    # employee NI = 287.55
    assert result.social_security_employee == Decimal("287.55")


def test_snapshot_contains_uk_rates():
    """Audit snapshot includes UK rates and tax code."""
    result = UKPayrollEngine().calculate(_uk_monthly_input())
    snap = result.calculation_snapshot

    assert snap["engine"] == "UKPayrollEngine v1"
    assert snap["country"] == "GB"
    assert snap["ni"]["category"] == "A"
    assert snap["ni"]["employee_main_rate"] == "0.08"
    assert snap["ni"]["employer_rate"] == "0.15"
    assert snap["paye"]["tax_code"] == "1257L"
    assert snap["paye"]["personal_allowance"] == "12570"


def test_uk_hourly_employee():
    """UK hourly employee, weekly."""
    input = PayCalculationInput(
        employee=EmployeeContext(
            employee_id="uk-emp-hourly",
            tax_info={"paye_tax_code": "1257L"},
        ),
        earnings=EarningsInput(
            pay_type="hourly",
            hourly_rate=Decimal("15.00"),
            hours=HoursWorked(regular=Decimal("40")),
        ),
        jurisdiction=JurisdictionContext(
            country="GB",
            pay_period_start=date(2026, 4, 6),
            pay_period_end=date(2026, 4, 12),
            pay_date=date(2026, 4, 14),
            pay_periods_per_year=52,
        ),
        ytd=YTDContext(tax_year=2026),
    )
    result = UKPayrollEngine().calculate(input)
    assert result.gross_pay == Decimal("600.00")
    assert result.federal_tax >= Decimal("0")
    assert result.social_security_employee >= Decimal("0")
    assert result.net_pay < result.gross_pay
