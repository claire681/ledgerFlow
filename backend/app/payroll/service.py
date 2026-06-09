"""Payroll orchestrator service.

This layer does NO database I/O. It operates over already-loaded data and
returns calculated results. The API layer is responsible for loading
employees/settings/YTD balances from DB and passing them in.

Reasons for this design:
1. Service is trivially unit-testable (no DB fixtures, no mocking)
2. API layer can batch loads or use async patterns however it wants
3. Same service can power both API requests and background jobs
4. Easy to add a CLI tool later that reads from CSV instead of DB
"""

from decimal import Decimal
from datetime import date
from typing import List, Dict, Optional, Any

from .types import (
    PayCalculationInput,
    PayCalculationResult,
    EmployeeContext,
    EarningsInput,
    HoursWorked,
    JurisdictionContext,
    YTDContext,
    PayRunEmployeeInput,
    CalculatedPayStub,
    PayRunPreviewResult,
)
from .registry import get_engine


class PayrollService:
    """Pure orchestration over loaded data. No DB I/O."""

    def build_calculation_input(
        self,
        employee: Dict[str, Any],
        hours_input: PayRunEmployeeInput,
        ytd: Dict[str, Any],
        jurisdiction: JurisdictionContext,
    ) -> PayCalculationInput:
        """Map employee row + hours input + YTD row to PayCalculationInput.

        Args:
            employee: dict-like representing an employees row (or an ORM object).
            hours_input: PayRunEmployeeInput with hours and extras.
            ytd: dict-like with YTD balance fields (or empty dict for new employees).
            jurisdiction: Country/subnational/pay period info for the run.
        """
        # Tax info JSONB or dict
        tax_info = employee.get("tax_info") or {}
        if not isinstance(tax_info, dict):
            tax_info = {}

        employee_ctx = EmployeeContext(
            employee_id=str(employee["id"]),
            td1_federal_code=tax_info.get("td1_federal_code"),
            td1_provincial_code=tax_info.get("td1_provincial_code"),
            w4_filing_status=tax_info.get("w4_filing_status"),
            w4_dependents=tax_info.get("w4_dependents"),
            ni_category=tax_info.get("ni_category"),
            tax_info=tax_info,
            cpp_exempt=bool(tax_info.get("cpp_exempt", False)),
            ei_exempt=bool(tax_info.get("ei_exempt", False)),
            fica_exempt=bool(tax_info.get("fica_exempt", False)),
            additional_withholding=Decimal(str(tax_info.get("additional_withholding", "0"))),
            vacation_pay_pct=Decimal(str(employee.get("vacation_pay_pct", "4.0") or "4.0")),
        )

        earnings = EarningsInput(
            pay_type=employee.get("pay_type") or "hourly",
            hourly_rate=(
                Decimal(str(employee["hourly_rate"]))
                if employee.get("hourly_rate") is not None
                else None
            ),
            salary_amount=Decimal(str(employee.get("salary_amount") or "0")),
            hours=hours_input.hours,
            bonus=hours_input.bonus,
            commission=hours_input.commission,
            reimbursement=hours_input.reimbursement,
        )

        ytd_ctx = YTDContext(
            tax_year=jurisdiction.pay_period_start.year,
            ytd_gross=Decimal(str(ytd.get("ytd_gross", "0") or "0")),
            ytd_federal_tax=Decimal(str(ytd.get("ytd_federal_tax", "0") or "0")),
            ytd_provincial_or_state_tax=Decimal(str(ytd.get("ytd_provincial_or_state_tax", "0") or "0")),
            ytd_social_security_employee=Decimal(str(ytd.get("ytd_social_security_employee", "0") or "0")),
            ytd_social_security_employer=Decimal(str(ytd.get("ytd_social_security_employer", "0") or "0")),
            ytd_unemployment_employee=Decimal(str(ytd.get("ytd_unemployment_employee", "0") or "0")),
            ytd_unemployment_employer=Decimal(str(ytd.get("ytd_unemployment_employer", "0") or "0")),
            ytd_pensionable_earnings=Decimal(str(ytd.get("ytd_pensionable_earnings", "0") or "0")),
            ytd_insurable_earnings=Decimal(str(ytd.get("ytd_insurable_earnings", "0") or "0")),
        )

        return PayCalculationInput(
            employee=employee_ctx,
            earnings=earnings,
            jurisdiction=jurisdiction,
            ytd=ytd_ctx,
        )

    def calculate_one_employee(
        self,
        employee: Dict[str, Any],
        hours_input: PayRunEmployeeInput,
        ytd: Dict[str, Any],
        jurisdiction: JurisdictionContext,
    ) -> PayCalculationResult:
        """Calculate pay for one employee. Pure function."""
        calc_input = self.build_calculation_input(
            employee=employee,
            hours_input=hours_input,
            ytd=ytd,
            jurisdiction=jurisdiction,
        )
        engine = get_engine(jurisdiction.country)
        return engine.calculate(calc_input)

    def compile_pay_stub(
        self,
        employee: Dict[str, Any],
        result: PayCalculationResult,
        hours_input: PayRunEmployeeInput,
        pay_run_id: Optional[str] = None,
    ) -> CalculatedPayStub:
        """Translate engine result + employee data into a CalculatedPayStub
        shape ready for DB persistence."""

        h = hours_input.hours
        return CalculatedPayStub(
            employee_id=str(employee["id"]),
            pay_run_id=pay_run_id,
            employee_name=f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip(),
            employee_email=employee.get("personal_email"),
            position_title=employee.get("position_title"),
            pay_type=employee.get("pay_type"),
            hourly_rate=(
                Decimal(str(employee["hourly_rate"]))
                if employee.get("hourly_rate") is not None else None
            ),
            salary_amount=Decimal(str(employee.get("salary_amount") or "0")),
            currency=employee.get("currency", "CAD"),

            hours_regular=h.regular,
            hours_overtime=h.overtime,
            hours_stat_holiday=h.stat_holiday,
            hours_vacation=h.vacation,
            hours_sick=h.sick,
            hours_evening=h.evening,
            hours_overnight=h.overnight,
            hours_weekend=h.weekend,
            hours_on_call=h.on_call,
            hours_travel=h.travel,

            gross_pay=result.gross_pay,
            bonus=hours_input.bonus,
            commission=hours_input.commission,
            reimbursement=hours_input.reimbursement,

            federal_tax=result.federal_tax,
            provincial_or_state_tax=result.provincial_or_state_tax,
            local_tax=result.local_tax,
            social_security_employee=result.social_security_employee,
            social_security_2_employee=result.social_security_2_employee,
            unemployment_employee=result.unemployment_employee,
            other_employee_deductions=result.other_employee_deductions,
            total_employee_deductions=result.total_employee_deductions,

            social_security_employer=result.social_security_employer,
            unemployment_employer=result.unemployment_employer,
            workers_comp_employer=result.workers_comp_employer,
            other_employer_contributions=result.other_employer_contributions,
            total_employer_contributions=result.total_employer_contributions,

            net_pay=result.net_pay,
            calculation_snapshot=result.calculation_snapshot,
        )

    def preview_run(
        self,
        employees_by_id: Dict[str, Dict[str, Any]],
        ytd_by_employee_id: Dict[str, Dict[str, Any]],
        employee_inputs: List[PayRunEmployeeInput],
        jurisdiction: JurisdictionContext,
        pay_run_id: Optional[str] = None,
    ) -> PayRunPreviewResult:
        """Run the full pay calculation for all employees in a pay run.

        Returns aggregate totals plus per-employee compiled pay stubs.
        No DB writes. The API layer decides whether to persist this.

        Args:
            employees_by_id: dict mapping employee_id -> employee row data.
            ytd_by_employee_id: dict mapping employee_id -> YTD balance row.
                Missing employees default to zero YTD.
            employee_inputs: hours/extras per employee for this run.
            jurisdiction: country/period info shared across all employees.
            pay_run_id: optional, attached to each stub for API persistence.
        """
        pay_stubs: List[CalculatedPayStub] = []
        total_gross = Decimal("0")
        total_employee_deductions = Decimal("0")
        total_employer_contributions = Decimal("0")
        total_net = Decimal("0")

        for hours_input in employee_inputs:
            emp_id = str(hours_input.employee_id)
            employee = employees_by_id.get(emp_id)
            if employee is None:
                raise ValueError(f"Employee {emp_id} not found in employees_by_id")

            ytd = ytd_by_employee_id.get(emp_id, {})

            result = self.calculate_one_employee(
                employee=employee,
                hours_input=hours_input,
                ytd=ytd,
                jurisdiction=jurisdiction,
            )

            stub = self.compile_pay_stub(
                employee=employee,
                result=result,
                hours_input=hours_input,
                pay_run_id=pay_run_id,
            )
            pay_stubs.append(stub)

            total_gross += result.gross_pay
            total_employee_deductions += result.total_employee_deductions
            total_employer_contributions += result.total_employer_contributions
            total_net += result.net_pay

        return PayRunPreviewResult(
            pay_run_id=pay_run_id,
            total_gross=total_gross,
            total_employee_deductions=total_employee_deductions,
            total_employer_contributions=total_employer_contributions,
            total_net=total_net,
            total_remittance_owed=total_employee_deductions + total_employer_contributions,
            employee_count=len(pay_stubs),
            pay_stubs=pay_stubs,
        )

    def compute_ytd_delta(
        self,
        result: PayCalculationResult,
    ) -> Dict[str, Decimal]:
        """Compute the YTD increments produced by one calculation result.

        Returns a dict of fields and amounts to ADD to the current YTD balance
        when this pay run is finalized.
        """
        return {
            "ytd_gross": result.gross_pay,
            "ytd_federal_tax": result.federal_tax,
            "ytd_provincial_or_state_tax": result.provincial_or_state_tax,
            "ytd_social_security_employee": result.social_security_employee,
            "ytd_social_security_employer": result.social_security_employer,
            "ytd_unemployment_employee": result.unemployment_employee,
            "ytd_unemployment_employer": result.unemployment_employer,
            "ytd_pensionable_earnings": Decimal(
                result.calculation_snapshot.get("cpp", {}).get("ytd_pensionable_after", "0")
                or "0"
            ),
            "ytd_insurable_earnings": Decimal(
                result.calculation_snapshot.get("ei", {}).get("ytd_insurable_after", "0")
                or result.calculation_snapshot.get("fica", {}).get("new_ytd_medicare", "0")
                or "0"
            ),
        }
