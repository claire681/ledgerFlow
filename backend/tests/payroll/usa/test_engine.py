"""Integration tests: USA payroll engine."""
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
from app.payroll.engines.usa import USAPayrollEngine


def _ca_biweekly_input(salary=None, hourly_rate=Decimal("30.00"), hours=Decimal("80")):
    earn = (
        EarningsInput(pay_type="salary", salary_amount=salary) if salary
        else EarningsInput(
            pay_type="hourly",
            hourly_rate=hourly_rate,
            hours=HoursWorked(regular=hours),
        )
    )
    return PayCalculationInput(
        employee=EmployeeContext(
            employee_id="us-emp-1",
            w4_filing_status="single",
        ),
        earnings=earn,
        jurisdiction=JurisdictionContext(
            country="US",
            subnational="CA",
            pay_period_start=date(2026, 1, 1),
            pay_period_end=date(2026, 1, 14),
            pay_date=date(2026, 1, 16),
            pay_periods_per_year=26,
        ),
        ytd=YTDContext(tax_year=2026),
    )


def test_california_biweekly_single():
    """CA single, 30/hr, 80 hours, biweekly, no YTD."""
    result = USAPayrollEngine().calculate(_ca_biweekly_input())

    # Gross: 80 * 30 = 2400
    assert result.gross_pay == Decimal("2400.00")

    # Federal tax: 209.60 (unit test value)
    assert result.federal_tax == Decimal("209.60")

    # State (CA): 77.27 (unit test value)
    assert result.provincial_or_state_tax == Decimal("77.27")

    # SS: 148.80, Medicare: 34.80
    assert result.social_security_employee == Decimal("148.80")
    assert result.other_employee_deductions["medicare"] == Decimal("34.80")

    # Additional Medicare = 0 (well under 200k)
    assert result.social_security_2_employee == Decimal("0")

    # Total employee deductions = 209.60 + 77.27 + 148.80 + 34.80 = 470.47
    assert result.total_employee_deductions == Decimal("470.47")

    # Net = 2400 - 470.47 = 1929.53
    assert result.net_pay == Decimal("1929.53")

    # Employer: SS 148.80 + Medicare 34.80 + FUTA 14.40 = 198.00
    assert result.total_employer_contributions == Decimal("198.00")

    # 7 deduction lines (no additional medicare)
    assert len(result.deduction_lines) == 7


def test_texas_no_state_tax():
    """TX employee, no state income tax."""
    input = _ca_biweekly_input()
    input.jurisdiction.subnational = "TX"
    result = USAPayrollEngine().calculate(input)
    assert result.provincial_or_state_tax == Decimal("0")


def test_unimplemented_state_returns_zero():
    """A state we haven't implemented returns 0 with snapshot flag."""
    input = _ca_biweekly_input()
    input.jurisdiction.subnational = "MA"  # not in handlers
    result = USAPayrollEngine().calculate(input)
    assert result.provincial_or_state_tax == Decimal("0")
    assert result.calculation_snapshot["state_implemented"] is False


def test_snapshot_complete():
    """Audit snapshot contains all federal + state rates."""
    result = USAPayrollEngine().calculate(_ca_biweekly_input())
    snap = result.calculation_snapshot

    assert snap["engine"] == "USAPayrollEngine v1"
    assert snap["country"] == "US"
    assert snap["subnational"] == "CA"
    assert snap["state_implemented"] is True
    assert snap["fica"]["ss_rate"] == "0.062"
    assert snap["fica"]["ss_wage_base"] == "181000.00"
    assert snap["futa"]["rate"] == "0.006"
    assert snap["federal_tax"]["filing_status"] == "single"


def test_high_earner_additional_medicare():
    """Earner above 200k YTD pays additional 0.9 percent medicare."""
    input = PayCalculationInput(
        employee=EmployeeContext(
            employee_id="us-emp-high",
            w4_filing_status="single",
        ),
        earnings=EarningsInput(
            pay_type="salary",
            salary_amount=Decimal("10000.00"),
        ),
        jurisdiction=JurisdictionContext(
            country="US",
            subnational="TX",
            pay_period_start=date(2026, 11, 1),
            pay_period_end=date(2026, 11, 30),
            pay_date=date(2026, 12, 2),
            pay_periods_per_year=12,
        ),
        ytd=YTDContext(
            tax_year=2026,
            ytd_insurable_earnings=Decimal("195000.00"),  # close to 200k
            ytd_pensionable_earnings=Decimal("181000.00"),  # SS capped
        ),
    )
    result = USAPayrollEngine().calculate(input)
    # Period 10000, new YTD medicare = 205000
    # Additional medicare on 5000 = 45.00
    assert result.social_security_2_employee == Decimal("45.00")


def test_dependents_reduce_federal_tax():
    """Two qualifying children reduce federal withholding."""
    input_no_kids = _ca_biweekly_input()
    input_two_kids = _ca_biweekly_input()
    input_two_kids.employee.tax_info = {"qualifying_children": 2}

    no_kids_result = USAPayrollEngine().calculate(input_no_kids)
    two_kids_result = USAPayrollEngine().calculate(input_two_kids)
    assert two_kids_result.federal_tax < no_kids_result.federal_tax
