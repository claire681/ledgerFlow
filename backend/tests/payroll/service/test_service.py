"""Tests for the orchestrator service. No DB - all data passed as dicts."""

from decimal import Decimal
from datetime import date
import pytest

from app.payroll.types import (
    PayRunEmployeeInput,
    HoursWorked,
    JurisdictionContext,
)
from app.payroll.service import PayrollService


@pytest.fixture
def service():
    return PayrollService()


@pytest.fixture
def alberta_jurisdiction():
    return JurisdictionContext(
        country="CA",
        subnational="AB",
        pay_period_start=date(2026, 1, 1),
        pay_period_end=date(2026, 1, 14),
        pay_date=date(2026, 1, 16),
        pay_periods_per_year=26,
    )


@pytest.fixture
def hourly_employee():
    return {
        "id": "emp-1",
        "first_name": "Alice",
        "last_name": "Smith",
        "personal_email": "alice@example.com",
        "position_title": "Care Aide",
        "pay_type": "hourly",
        "hourly_rate": "25.00",
        "salary_amount": "0",
        "currency": "CAD",
        "tax_info": {},
    }


def test_build_input_from_dict(service, alberta_jurisdiction, hourly_employee):
    """build_calculation_input maps dict employee to PayCalculationInput."""
    hours_input = PayRunEmployeeInput(
        employee_id="emp-1",
        hours=HoursWorked(regular=Decimal("80")),
    )
    calc_input = service.build_calculation_input(
        employee=hourly_employee,
        hours_input=hours_input,
        ytd={},
        jurisdiction=alberta_jurisdiction,
    )

    assert calc_input.employee.employee_id == "emp-1"
    assert calc_input.earnings.pay_type == "hourly"
    assert calc_input.earnings.hourly_rate == Decimal("25.00")
    assert calc_input.earnings.hours.regular == Decimal("80")
    assert calc_input.jurisdiction.country == "CA"
    assert calc_input.ytd.tax_year == 2026


def test_calculate_one_employee_matches_engine_directly(
    service, alberta_jurisdiction, hourly_employee
):
    """Service calculation matches direct engine call result."""
    hours_input = PayRunEmployeeInput(
        employee_id="emp-1",
        hours=HoursWorked(regular=Decimal("80")),
    )
    result = service.calculate_one_employee(
        employee=hourly_employee,
        hours_input=hours_input,
        ytd={},
        jurisdiction=alberta_jurisdiction,
    )
    # Match the Canada integration test value
    assert result.gross_pay == Decimal("2000.00")
    assert result.net_pay == Decimal("1529.64")


def test_preview_run_aggregates_correctly(service, alberta_jurisdiction, hourly_employee):
    """preview_run sums all employees correctly."""
    # Two employees, same hourly rate
    emp2 = dict(hourly_employee)
    emp2["id"] = "emp-2"
    emp2["first_name"] = "Bob"
    emp2["last_name"] = "Jones"

    employees_by_id = {"emp-1": hourly_employee, "emp-2": emp2}

    inputs = [
        PayRunEmployeeInput(
            employee_id="emp-1",
            hours=HoursWorked(regular=Decimal("80")),
        ),
        PayRunEmployeeInput(
            employee_id="emp-2",
            hours=HoursWorked(regular=Decimal("80")),
        ),
    ]

    preview = service.preview_run(
        employees_by_id=employees_by_id,
        ytd_by_employee_id={},
        employee_inputs=inputs,
        jurisdiction=alberta_jurisdiction,
    )

    # 2 employees, both 2000 gross, both 1529.64 net
    assert preview.employee_count == 2
    assert preview.total_gross == Decimal("4000.00")
    assert preview.total_net == Decimal("3059.28")
    assert len(preview.pay_stubs) == 2


def test_missing_employee_raises(service, alberta_jurisdiction):
    """Hours input for an unknown employee raises ValueError."""
    inputs = [PayRunEmployeeInput(employee_id="ghost-emp")]

    with pytest.raises(ValueError) as exc_info:
        service.preview_run(
            employees_by_id={},
            ytd_by_employee_id={},
            employee_inputs=inputs,
            jurisdiction=alberta_jurisdiction,
        )
    assert "ghost-emp" in str(exc_info.value)


def test_compile_pay_stub_has_all_fields(service, alberta_jurisdiction, hourly_employee):
    """Pay stub compilation produces complete row data."""
    hours_input = PayRunEmployeeInput(
        employee_id="emp-1",
        hours=HoursWorked(regular=Decimal("80")),
    )
    result = service.calculate_one_employee(
        employee=hourly_employee,
        hours_input=hours_input,
        ytd={},
        jurisdiction=alberta_jurisdiction,
    )
    stub = service.compile_pay_stub(
        employee=hourly_employee,
        result=result,
        hours_input=hours_input,
        pay_run_id="run-1",
    )

    assert stub.employee_id == "emp-1"
    assert stub.pay_run_id == "run-1"
    assert stub.employee_name == "Alice Smith"
    assert stub.employee_email == "alice@example.com"
    assert stub.gross_pay == Decimal("2000.00")
    assert stub.federal_tax == Decimal("206.95")
    assert stub.social_security_employee == Decimal("110.99")
    assert stub.calculation_snapshot["engine"] == "CanadaPayrollEngine v1"


def test_ytd_delta_for_finalize(service, alberta_jurisdiction, hourly_employee):
    """compute_ytd_delta returns the YTD increments after a run finalizes."""
    hours_input = PayRunEmployeeInput(
        employee_id="emp-1",
        hours=HoursWorked(regular=Decimal("80")),
    )
    result = service.calculate_one_employee(
        employee=hourly_employee,
        hours_input=hours_input,
        ytd={},
        jurisdiction=alberta_jurisdiction,
    )
    delta = service.compute_ytd_delta(result)

    assert delta["ytd_gross"] == Decimal("2000.00")
    assert delta["ytd_federal_tax"] == Decimal("206.95")
    assert delta["ytd_social_security_employee"] == Decimal("110.99")
    # CPP YTD pensionable from snapshot
    assert delta["ytd_pensionable_earnings"] == Decimal("1865.38")


def test_multi_country_preview_works(service):
    """Service can run different countries on different runs."""
    # UK monthly employee
    uk_employee = {
        "id": "uk-1",
        "first_name": "Sarah",
        "last_name": "Brown",
        "personal_email": "sarah@example.com",
        "pay_type": "salary",
        "salary_amount": "3000",
        "currency": "GBP",
        "tax_info": {"paye_tax_code": "1257L", "ni_category": "A"},
    }
    uk_jurisdiction = JurisdictionContext(
        country="GB",
        pay_period_start=date(2026, 4, 6),
        pay_period_end=date(2026, 5, 5),
        pay_date=date(2026, 5, 7),
        pay_periods_per_year=12,
    )
    inputs = [PayRunEmployeeInput(employee_id="uk-1")]
    preview = service.preview_run(
        employees_by_id={"uk-1": uk_employee},
        ytd_by_employee_id={},
        employee_inputs=inputs,
        jurisdiction=uk_jurisdiction,
    )
    # UK monthly basic match from earlier test
    assert preview.total_gross == Decimal("3000.00")
    assert preview.total_net == Decimal("2453.30")
