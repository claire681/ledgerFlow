"""UK payroll engine.

Implements PayrollEngine for the United Kingdom (England, Wales, NI).
Scotland uses different income tax bands and will be a separate sub-engine in v2.

Orchestrates:
- gross_pay computation from earnings
- NI Category A (ni.py)
- PAYE income tax (paye.py)

Pure function. Result includes calculation_snapshot for audit.
"""

from decimal import Decimal
from typing import Optional

from ...types import (
    PayCalculationInput,
    PayCalculationResult,
    DeductionLine,
    EarningsInput,
)
from ...base import PayrollEngine
from . import ni, paye


class UKPayrollEngine(PayrollEngine):
    """UK payroll engine (England, Wales, Northern Ireland)."""

    country = "GB"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        emp = input.employee
        earn = input.earnings
        juris = input.jurisdiction
        ytd = input.ytd

        # 1. Compute gross
        gross_pay = self._compute_gross(earn)

        # 2. NI (Category A for v1, more categories later)
        ni_category = emp.ni_category or "A"
        if ni_category != "A":
            # Fallback to A; other categories TBD
            ni_category = "A"

        ni_employee, ni_employer = ni.calculate_ni_category_a(
            gross_pay=gross_pay,
            pay_periods_per_year=juris.pay_periods_per_year,
        )

        # 3. PAYE income tax
        tax_code = emp.tax_info.get("paye_tax_code", "1257L")
        income_tax = paye.calculate_paye(
            gross_pay=gross_pay,
            pay_periods_per_year=juris.pay_periods_per_year,
            tax_code=tax_code,
            additional_withholding=emp.additional_withholding,
        )

        # 4. Totals
        total_employee_deductions = income_tax + ni_employee
        total_employer_contributions = ni_employer

        # 5. Net
        net_pay = gross_pay - total_employee_deductions + earn.reimbursement

        # 6. Deduction lines
        deduction_lines = [
            DeductionLine(
                name="paye", label="Income Tax (PAYE)", amount=income_tax,
                notes=f"Tax code: {tax_code}",
            ),
            DeductionLine(
                name="ni_employee", label="National Insurance", amount=ni_employee,
                notes=f"Category {ni_category}",
            ),
            DeductionLine(
                name="ni_employer", label="NI (Employer)", amount=ni_employer,
                is_employer=True,
            ),
        ]

        # 7. Snapshot
        snapshot = {
            "engine": "UKPayrollEngine v1",
            "country": "GB",
            "subnational": juris.subnational,
            "tax_year": ytd.tax_year,
            "pay_periods_per_year": juris.pay_periods_per_year,
            "gross_pay": str(gross_pay),
            "ni": {
                "category": ni_category,
                "pt_annual": str(ni.PT_ANNUAL),
                "uel_annual": str(ni.UEL_ANNUAL),
                "st_annual": str(ni.ST_ANNUAL),
                "employee_main_rate": str(ni.NI_EMPLOYEE_MAIN_RATE),
                "employee_additional_rate": str(ni.NI_EMPLOYEE_ADDITIONAL_RATE),
                "employer_rate": str(ni.NI_EMPLOYER_RATE),
                "employee": str(ni_employee),
                "employer": str(ni_employer),
            },
            "paye": {
                "tax_code": tax_code,
                "personal_allowance": str(paye.parse_tax_code(tax_code)),
                "amount": str(income_tax),
                "additional_withholding": str(emp.additional_withholding),
            },
            "totals": {
                "total_employee_deductions": str(total_employee_deductions),
                "total_employer_contributions": str(total_employer_contributions),
                "net_pay": str(net_pay),
            },
        }

        return PayCalculationResult(
            gross_pay=gross_pay,
            federal_tax=income_tax,  # PAYE maps to federal_tax field
            provincial_or_state_tax=Decimal("0"),
            local_tax=Decimal("0"),
            social_security_employee=ni_employee,
            social_security_2_employee=Decimal("0"),
            unemployment_employee=Decimal("0"),  # UK has no separate unemployment deduction
            other_employee_deductions={},
            total_employee_deductions=total_employee_deductions,
            social_security_employer=ni_employer,
            unemployment_employer=Decimal("0"),
            workers_comp_employer=Decimal("0"),
            other_employer_contributions={},
            total_employer_contributions=total_employer_contributions,
            net_pay=net_pay,
            deduction_lines=deduction_lines,
            calculation_snapshot=snapshot,
        )

    def _compute_gross(self, earn: EarningsInput) -> Decimal:
        """Same logic as Canada for now. Override if UK-specific premiums emerge."""
        if earn.pay_type == "salary":
            base = earn.salary_amount
        else:
            h = earn.hours
            rate = earn.hourly_rate or Decimal("0")
            regular_rate_hours = (
                h.regular + h.vacation + h.sick
                + h.evening + h.overnight + h.weekend
                + h.on_call + h.travel
            )
            premium_hours = h.overtime + h.stat_holiday
            base = (regular_rate_hours * rate) + (premium_hours * rate * Decimal("1.5"))
        return (base + earn.bonus + earn.commission).quantize(Decimal("0.01"))
