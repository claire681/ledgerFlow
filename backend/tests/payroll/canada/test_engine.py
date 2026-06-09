"""Integration tests: full Canadian payroll engine end-to-end."""

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
from app.payroll.engines.canada import CanadaPayrollEngine


def _alberta_biweekly_input(hourly_rate=Decimal("25.00"), hours_regular=Decimal("80"), reimbursement=Decimal("0")):
    return PayCalculationInput(
        employee=EmployeeContext(employee_id="emp-1"),
        earnings=EarningsInput(
            pay_type="hourly",
            hourly_rate=hourly_rate,
            hours=HoursWorked(regular=hours_regular),
            reimbursement=reimbursement,
        ),
        jurisdiction=JurisdictionContext(
            country="CA",
            subnational="AB",
            pay_period_start=date(2026, 1, 1),
            pay_period_end=date(2026, 1, 14),
            pay_date=date(2026, 1, 16),
            pay_periods_per_year=26,
        ),
        ytd=YTDContext(tax_year=2026),
    )


def test_alberta_biweekly_basic():
    """Biweekly Alberta employee, 25/hr, 80 regular hours, no YTD."""
    result = CanadaPayrollEngine().calculate(_alberta_biweekly_input())

    # 80 * 25 = 2000
    assert result.gross_pay == Decimal("2000.00")

    # Values must match the unit-test expectations from cpp/ei/federal/alberta
    assert result.social_security_employee == Decimal("110.99")  # CPP
    assert result.social_security_2_employee == Decimal("0")     # CPP2 (under YMPE)
    assert result.unemployment_employee == Decimal("33.20")      # EI
    assert result.federal_tax == Decimal("206.95")
    assert result.provincial_or_state_tax == Decimal("119.22")

    # Total deductions = 110.99 + 33.20 + 206.95 + 119.22 = 470.36
    assert result.total_employee_deductions == Decimal("470.36")

    # Employer = CPP + CPP2 + EI = 110.99 + 0 + 46.48 = 157.47
    assert result.total_employer_contributions == Decimal("157.47")

    # Net = 2000 - 470.36 = 1529.64
    assert result.net_pay == Decimal("1529.64")

    # Snapshot present
    assert result.calculation_snapshot["engine"] == "CanadaPayrollEngine v1"
    assert result.calculation_snapshot["country"] == "CA"
    assert result.calculation_snapshot["subnational"] == "AB"

    # 8 deduction lines (fed, prov, cpp, cpp2, ei, cpp_emp, cpp2_emp, ei_emp)
    assert len(result.deduction_lines) == 8


def test_salary_monthly_alberta():
    """Salary employee, monthly, Alberta - all deductions positive."""
    input = PayCalculationInput(
        employee=EmployeeContext(employee_id="emp-2"),
        earnings=EarningsInput(
            pay_type="salary",
            salary_amount=Decimal("5000.00"),
        ),
        jurisdiction=JurisdictionContext(
            country="CA",
            subnational="AB",
            pay_period_start=date(2026, 1, 1),
            pay_period_end=date(2026, 1, 31),
            pay_date=date(2026, 2, 2),
            pay_periods_per_year=12,
        ),
        ytd=YTDContext(tax_year=2026),
    )
    result = CanadaPayrollEngine().calculate(input)

    assert result.gross_pay == Decimal("5000.00")
    assert result.federal_tax > Decimal("0")
    assert result.provincial_or_state_tax > Decimal("0")
    assert result.social_security_employee > Decimal("0")
    assert result.unemployment_employee > Decimal("0")
    assert Decimal("0") < result.net_pay < result.gross_pay


def test_quebec_skips_cpp_and_provincial():
    """Quebec: CPP = 0 (uses QPP), provincial = 0 (not implemented)."""
    input = PayCalculationInput(
        employee=EmployeeContext(employee_id="emp-3"),
        earnings=EarningsInput(
            pay_type="hourly",
            hourly_rate=Decimal("25.00"),
            hours=HoursWorked(regular=Decimal("80")),
        ),
        jurisdiction=JurisdictionContext(
            country="CA",
            subnational="QC",
            pay_period_start=date(2026, 1, 1),
            pay_period_end=date(2026, 1, 14),
            pay_date=date(2026, 1, 16),
            pay_periods_per_year=26,
        ),
        ytd=YTDContext(tax_year=2026),
    )
    result = CanadaPayrollEngine().calculate(input)

    assert result.social_security_employee == Decimal("0")
    assert result.provincial_or_state_tax == Decimal("0")
    assert result.federal_tax > Decimal("0")


def test_reimbursement_added_to_net():
    """Reimbursements are non-taxed and added to net pay."""
    result = CanadaPayrollEngine().calculate(
        _alberta_biweekly_input(reimbursement=Decimal("50.00"))
    )
    # Gross excludes reimbursement
    assert result.gross_pay == Decimal("2000.00")
    # Net = gross - deductions + reimbursement = 2000 - 470.36 + 50 = 1579.64
    assert result.net_pay == Decimal("1579.64")


def test_overtime_pays_1_5x():
    """Overtime hours pay at 1.5x rate."""
    input = PayCalculationInput(
        employee=EmployeeContext(employee_id="emp-4"),
        earnings=EarningsInput(
            pay_type="hourly",
            hourly_rate=Decimal("20.00"),
            hours=HoursWorked(
                regular=Decimal("80"),
                overtime=Decimal("10"),
            ),
        ),
        jurisdiction=JurisdictionContext(
            country="CA",
            subnational="AB",
            pay_period_start=date(2026, 1, 1),
            pay_period_end=date(2026, 1, 14),
            pay_date=date(2026, 1, 16),
            pay_periods_per_year=26,
        ),
        ytd=YTDContext(tax_year=2026),
    )
    result = CanadaPayrollEngine().calculate(input)
    # 80 * 20 + 10 * 20 * 1.5 = 1600 + 300 = 1900
    assert result.gross_pay == Decimal("1900.00")


def test_snapshot_contains_all_rates_used():
    """Audit snapshot must include the rates and constants used."""
    result = CanadaPayrollEngine().calculate(_alberta_biweekly_input())
    snap = result.calculation_snapshot

    # All rate sources documented
    assert snap["cpp"]["rate"] == "0.0595"
    assert snap["cpp"]["ympe"] == "71300.00"
    assert snap["ei"]["rate_employee"] == "0.0166"
    assert snap["ei"]["mie"] == "65700.00"

    # Totals match the result fields
    assert snap["totals"]["total_employee_deductions"] == str(result.total_employee_deductions)
    assert snap["totals"]["net_pay"] == str(result.net_pay)
