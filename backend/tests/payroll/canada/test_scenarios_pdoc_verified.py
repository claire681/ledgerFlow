"""End-to-end CanadaPayrollEngine tests verified against CRA PDOC.

Each test locks in a scenario with exact expected values obtained from
the CRA Payroll Deductions Online Calculator (PDOC). If any of these
values change unexpectedly, the tests fail and the deploy is blocked.

All scenarios use:
  - Province: Alberta
  - Pay frequency: bi-weekly (26 periods/year)
  - Federal claim code 1 (basic personal amount $16,452)
  - Alberta claim code 1 (basic personal amount $22,769)
  - Not exempt from CPP or EI
  - No additional withholding
  - No YTD earnings (start of year, YTD = 0)

Verified 2026-07-05 against CRA PDOC (July 2026 edition).
"""

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


def _make_input(gross_per_period: float, hourly_rate: float) -> PayCalculationInput:
    """Build a PayCalculationInput for the shared Alberta bi-weekly scenario."""
    hours = gross_per_period / hourly_rate
    return PayCalculationInput(
        employee=EmployeeContext(
            employee_id="test-claire",
            td1_federal_code=16452,
            td1_provincial_code=22769,
            cpp_exempt=False,
            ei_exempt=False,
            additional_withholding=Decimal("0"),
        ),
        earnings=EarningsInput(
            pay_type="hourly",
            hourly_rate=Decimal(str(hourly_rate)),
            hours=HoursWorked(regular=Decimal(str(hours))),
        ),
        jurisdiction=JurisdictionContext(
            country="CA",
            subnational="AB",
            pay_period_start=date(2026, 7, 1),
            pay_period_end=date(2026, 7, 14),
            pay_date=date(2026, 7, 14),
            pay_periods_per_year=26,
        ),
        ytd=YTDContext(tax_year=2026),
    )


def test_scenario_a_below_bpa():
    """20 hours x $22 = $440 gross. Below both federal and Alberta BPA."""
    result = CanadaPayrollEngine().calculate(_make_input(440, 22))
    assert result.gross_pay == Decimal("440.00")
    assert result.federal_tax == Decimal("0.00")
    assert result.provincial_or_state_tax == Decimal("0.00")
    assert result.social_security_employee == Decimal("18.17")
    assert result.social_security_2_employee == Decimal("0")
    assert result.unemployment_employee == Decimal("7.17")
    assert result.total_employee_deductions == Decimal("25.34")
    assert result.net_pay == Decimal("414.66")


def test_scenario_b_claire_actual():
    """40 hours x $22 = $880 gross. Claire at BrightCare, real scenario."""
    result = CanadaPayrollEngine().calculate(_make_input(880, 22))
    assert result.gross_pay == Decimal("880.00")
    assert result.federal_tax == Decimal("18.31")
    assert result.provincial_or_state_tax == Decimal("0.00")
    assert result.social_security_employee == Decimal("44.35")
    assert result.social_security_2_employee == Decimal("0")
    assert result.unemployment_employee == Decimal("14.34")
    assert result.total_employee_deductions == Decimal("77.00")
    assert result.net_pay == Decimal("803.00")


def test_scenario_c_mid_range():
    """80 hours x $22 = $1,760 gross. Mid-range Alberta employee."""
    result = CanadaPayrollEngine().calculate(_make_input(1760, 22))
    assert result.gross_pay == Decimal("1760.00")
    assert result.federal_tax == Decimal("132.17")
    assert result.provincial_or_state_tax == Decimal("60.71")
    assert result.social_security_employee == Decimal("96.71")
    assert result.social_security_2_employee == Decimal("0")
    assert result.unemployment_employee == Decimal("28.69")
    assert result.total_employee_deductions == Decimal("318.28")
    assert result.net_pay == Decimal("1441.72")


def test_scenario_d_higher_earner():
    """160 hours x $22 = $3,520 gross. Higher earner, into federal bracket 2."""
    result = CanadaPayrollEngine().calculate(_make_input(3520, 22))
    assert result.gross_pay == Decimal("3520.00")
    assert result.federal_tax == Decimal("446.69")
    assert result.provincial_or_state_tax == Decimal("217.19")
    assert result.social_security_employee == Decimal("201.43")
    assert result.social_security_2_employee == Decimal("0")
    assert result.unemployment_employee == Decimal("57.38")
    assert result.total_employee_deductions == Decimal("922.69")
    assert result.net_pay == Decimal("2597.31")
