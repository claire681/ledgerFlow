"""Ireland payroll engine.

Implements PayrollEngine for the Republic of Ireland.

Orchestrates:
- PAYE income tax (paye.py)
- USC - Universal Social Charge (usc.py)
- PRSI - Pay Related Social Insurance, Class A1 (prsi.py)

Pure function. Snapshot for audit.
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
from . import paye, usc, prsi


class IrelandPayrollEngine(PayrollEngine):
    """Ireland payroll engine. PAYE + USC + PRSI."""

    country = "IE"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        emp = input.employee
        earn = input.earnings
        juris = input.jurisdiction
        ytd = input.ytd

        # 1. Gross
        gross_pay = self._compute_gross(earn)

        # 2. PAYE
        srcop = emp.tax_info.get("srcop")
        srcop_decimal = Decimal(str(srcop)) if srcop is not None else None
        tax_credits = emp.tax_info.get("annual_tax_credits")
        tax_credits_decimal = (
            Decimal(str(tax_credits)) if tax_credits is not None else None
        )
        paye_tax = paye.calculate_paye(
            gross_pay=gross_pay,
            pay_periods_per_year=juris.pay_periods_per_year,
            srcop_annual=srcop_decimal,
            annual_tax_credits=tax_credits_decimal,
            additional_withholding=emp.additional_withholding,
        )

        # 3. USC
        usc_exempt = emp.tax_info.get("usc_exempt", False)
        usc_amount = usc.calculate_usc(
            gross_pay=gross_pay,
            pay_periods_per_year=juris.pay_periods_per_year,
            exempt=usc_exempt,
        )

        # 4. PRSI
        prsi_class = emp.tax_info.get("prsi_class", "A1")
        prsi_employee, prsi_employer = prsi.calculate_prsi(
            gross_pay=gross_pay,
            pay_periods_per_year=juris.pay_periods_per_year,
            class_code=prsi_class,
        )

        # 5. Totals
        total_employee_deductions = paye_tax + usc_amount + prsi_employee
        total_employer_contributions = prsi_employer

        # 6. Net
        net_pay = gross_pay - total_employee_deductions + earn.reimbursement

        # 7. Deduction lines
        deduction_lines = [
            DeductionLine(name="paye", label="PAYE", amount=paye_tax),
            DeductionLine(name="usc", label="USC", amount=usc_amount),
            DeductionLine(
                name="prsi", label="PRSI",
                amount=prsi_employee, rate=prsi.PRSI_EMPLOYEE_RATE,
                notes=f"Class {prsi_class}",
            ),
            DeductionLine(
                name="prsi_employer", label="PRSI (Employer)",
                amount=prsi_employer, is_employer=True,
            ),
        ]

        # 8. Snapshot
        srcop_used = srcop_decimal if srcop_decimal else paye.SRCOP_SINGLE
        credits_used = (
            tax_credits_decimal if tax_credits_decimal
            else paye.PERSONAL_CREDIT_SINGLE + paye.EMPLOYEE_CREDIT
        )
        snapshot = {
            "engine": "IrelandPayrollEngine v1",
            "country": "IE",
            "tax_year": ytd.tax_year,
            "pay_periods_per_year": juris.pay_periods_per_year,
            "gross_pay": str(gross_pay),
            "paye": {
                "amount": str(paye_tax),
                "srcop": str(srcop_used),
                "annual_tax_credits": str(credits_used),
                "standard_rate": str(paye.STANDARD_RATE),
                "higher_rate": str(paye.HIGHER_RATE),
                "additional_withholding": str(emp.additional_withholding),
            },
            "usc": {
                "amount": str(usc_amount),
                "exempt": usc_exempt,
                "exemption_threshold": str(usc.USC_EXEMPTION_THRESHOLD),
            },
            "prsi": {
                "class": prsi_class,
                "employee_rate": str(prsi.PRSI_EMPLOYEE_RATE),
                "employer_rate_low": str(prsi.PRSI_EMPLOYER_RATE_LOW),
                "employer_rate_high": str(prsi.PRSI_EMPLOYER_RATE_HIGH),
                "employee": str(prsi_employee),
                "employer": str(prsi_employer),
            },
            "totals": {
                "total_employee_deductions": str(total_employee_deductions),
                "total_employer_contributions": str(total_employer_contributions),
                "net_pay": str(net_pay),
            },
        }

        return PayCalculationResult(
            gross_pay=gross_pay,
            federal_tax=paye_tax,  # PAYE in federal_tax slot
            provincial_or_state_tax=Decimal("0"),
            local_tax=usc_amount,  # USC in local_tax slot
            social_security_employee=prsi_employee,
            social_security_2_employee=Decimal("0"),
            unemployment_employee=Decimal("0"),
            other_employee_deductions={},
            total_employee_deductions=total_employee_deductions,
            social_security_employer=prsi_employer,
            unemployment_employer=Decimal("0"),
            workers_comp_employer=Decimal("0"),
            other_employer_contributions={},
            total_employer_contributions=total_employer_contributions,
            net_pay=net_pay,
            deduction_lines=deduction_lines,
            calculation_snapshot=snapshot,
        )

    def _compute_gross(self, earn: EarningsInput) -> Decimal:
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
