"""Integration tests: Ireland payroll engine."""
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
from app.payroll.engines.ireland import IrelandPayrollEngine


def _ie_monthly_input(salary=Decimal("3000.00"), tax_info=None):
    return PayCalculationInput(
        employee=EmployeeContext(
            employee_id="ie-emp-1",
            tax_info=tax_info or {},
        ),
        earnings=EarningsInput(
            pay_type="salary",
            salary_amount=salary,
        ),
        jurisdiction=JurisdictionContext(
            country="IE",
            pay_period_start=date(2026, 1, 1),
            pay_period_end=date(2026, 1, 31),
            pay_date=date(2026, 2, 2),
            pay_periods_per_year=12,
        ),
        ytd=YTDContext(tax_year=2026),
    )


def test_ireland_monthly_single_basic():
    """Single employee, 3000 monthly salary, default credits."""
    result = IrelandPayrollEngine().calculate(_ie_monthly_input())

    assert result.gross_pay == Decimal("3000.00")

    # PAYE: 266.67 (from unit test)
    assert result.federal_tax == Decimal("266.67")
    # USC: 52.17
    assert result.local_tax == Decimal("52.17")
    # PRSI employee: 123.00
    assert result.social_security_employee == Decimal("123.00")
    # PRSI employer: 334.50
    assert result.social_security_employer == Decimal("334.50")

    # Total employee = 266.67 + 52.17 + 123.00 = 441.84
    assert result.total_employee_deductions == Decimal("441.84")

    # Net = 3000 - 441.84 = 2558.16
    assert result.net_pay == Decimal("2558.16")

    # 4 deduction lines (PAYE, USC, PRSI emp, PRSI er)
    assert len(result.deduction_lines) == 4


def test_ireland_married_lower_paye():
    """Married SRCOP is higher = less tax in 40 percent band."""
    single = IrelandPayrollEngine().calculate(
        _ie_monthly_input(salary=Decimal("5000.00"))
    )
    married = IrelandPayrollEngine().calculate(
        _ie_monthly_input(
            salary=Decimal("5000.00"),
            tax_info={
                "srcop": 53000,
                "annual_tax_credits": 4000,
            },
        )
    )
    assert married.federal_tax < single.federal_tax


def test_snapshot_complete():
    """Audit snapshot has Irish rates."""
    result = IrelandPayrollEngine().calculate(_ie_monthly_input())
    snap = result.calculation_snapshot

    assert snap["engine"] == "IrelandPayrollEngine v1"
    assert snap["country"] == "IE"
    assert snap["paye"]["standard_rate"] == "0.20"
    assert snap["paye"]["higher_rate"] == "0.40"
    assert snap["prsi"]["class"] == "A1"
    assert snap["prsi"]["employee_rate"] == "0.041"


def test_low_earner_no_paye_no_usc():
    """Annual under combined thresholds = zero PAYE and USC."""
    result = IrelandPayrollEngine().calculate(
        _ie_monthly_input(salary=Decimal("1000.00"))
    )
    # Annual 12000 < USC exemption 13000 = 0 USC
    assert result.local_tax == Decimal("0")
    # Annual tax = 12000 * 0.20 = 2400, credits 4000 = 0 PAYE
    assert result.federal_tax == Decimal("0")
    # Only PRSI remains
    assert result.social_security_employee == Decimal("41.00")
