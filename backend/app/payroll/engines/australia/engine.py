"""Australia payroll engine.

Implements PayrollEngine for Australia.

Orchestrates:
- PAYG Withholding (paygw.py)
- Medicare Levy (medicare_levy.py)
- Superannuation Guarantee (super.py) - employer-only

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
from . import paygw, medicare_levy
from . import super as super_module  # 'super' is a Python builtin


class AustraliaPayrollEngine(PayrollEngine):
    """Australia payroll engine."""

    country = "AU"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        emp = input.employee
        earn = input.earnings
        juris = input.jurisdiction
        ytd = input.ytd

        # 1. Gross pay (taxable)
        gross_pay, overtime_pay = self._compute_gross_with_overtime_split(earn)

        # 2. PAYG withholding
        claim_threshold = emp.tax_info.get("claim_tax_free_threshold", True)
        has_tfn = emp.tax_info.get("has_tfn", True)
        paygw_tax = paygw.calculate_paygw(
            gross_pay=gross_pay,
            pay_periods_per_year=juris.pay_periods_per_year,
            tax_free_threshold_claimed=claim_threshold,
            has_tfn=has_tfn,
            additional_withholding=emp.additional_withholding,
        )

        # 3. Medicare Levy
        medicare_exempt = emp.tax_info.get("medicare_levy_exempt", False)
        medicare = medicare_levy.calculate_medicare_levy(
            gross_pay=gross_pay,
            pay_periods_per_year=juris.pay_periods_per_year,
            exempt=medicare_exempt,
        )

        # 4. Super (on OTE = gross - overtime)
        ote = gross_pay - overtime_pay
        super_contribution = super_module.calculate_super(
            ote_pay=ote,
            pay_periods_per_year=juris.pay_periods_per_year,
        )

        # 5. Totals
        total_employee_deductions = paygw_tax + medicare
        total_employer_contributions = super_contribution

        # 6. Net
        net_pay = gross_pay - total_employee_deductions + earn.reimbursement

        # 7. Deduction lines
        deduction_lines = [
            DeductionLine(name="paygw", label="PAYG Tax", amount=paygw_tax),
            DeductionLine(name="medicare_levy", label="Medicare Levy", amount=medicare),
            DeductionLine(
                name="superannuation", label="Superannuation (Employer)",
                amount=super_contribution, is_employer=True,
                rate=super_module.SUPER_RATE,
                notes="OTE base, excludes overtime",
            ),
        ]

        # 8. Snapshot
        snapshot = {
            "engine": "AustraliaPayrollEngine v1",
            "country": "AU",
            "tax_year": ytd.tax_year,
            "pay_periods_per_year": juris.pay_periods_per_year,
            "gross_pay": str(gross_pay),
            "overtime_pay": str(overtime_pay),
            "ote": str(ote),
            "paygw": {
                "amount": str(paygw_tax),
                "tax_free_threshold_claimed": claim_threshold,
                "has_tfn": has_tfn,
                "additional_withholding": str(emp.additional_withholding),
            },
            "medicare_levy": {
                "rate": str(medicare_levy.MEDICARE_LEVY_RATE),
                "threshold": str(medicare_levy.LEVY_THRESHOLD_ANNUAL),
                "amount": str(medicare),
            },
            "super": {
                "rate": str(super_module.SUPER_RATE),
                "mcb_quarterly": str(super_module.MCB_QUARTERLY_2026),
                "ote_base": str(ote),
                "amount": str(super_contribution),
            },
            "totals": {
                "total_employee_deductions": str(total_employee_deductions),
                "total_employer_contributions": str(total_employer_contributions),
                "net_pay": str(net_pay),
            },
        }

        return PayCalculationResult(
            gross_pay=gross_pay,
            federal_tax=paygw_tax,
            provincial_or_state_tax=Decimal("0"),
            local_tax=medicare,  # Medicare Levy stored as local_tax for consistency
            social_security_employee=Decimal("0"),
            social_security_2_employee=Decimal("0"),
            unemployment_employee=Decimal("0"),
            other_employee_deductions={},
            total_employee_deductions=total_employee_deductions,
            social_security_employer=Decimal("0"),
            unemployment_employer=Decimal("0"),
            workers_comp_employer=Decimal("0"),
            other_employer_contributions={"superannuation": super_contribution},
            total_employer_contributions=total_employer_contributions,
            net_pay=net_pay,
            deduction_lines=deduction_lines,
            calculation_snapshot=snapshot,
        )

    def _compute_gross_with_overtime_split(
        self, earn: EarningsInput
    ) -> tuple:
        """Compute (total_gross, overtime_portion). Super applies to OTE only."""
        if earn.pay_type == "salary":
            return (
                (earn.salary_amount + earn.bonus + earn.commission).quantize(
                    Decimal("0.01")
                ),
                Decimal("0"),
            )

        h = earn.hours
        rate = earn.hourly_rate or Decimal("0")

        regular_rate_hours = (
            h.regular + h.vacation + h.sick
            + h.evening + h.overnight + h.weekend
            + h.on_call + h.travel
        )
        # In AU, stat_holiday is paid at penalty rates but is considered OTE
        # Overtime is NOT OTE; tracked separately for super exclusion
        regular_pay = regular_rate_hours * rate
        stat_pay = h.stat_holiday * rate * Decimal("1.5")
        overtime_pay = h.overtime * rate * Decimal("1.5")

        gross = (regular_pay + stat_pay + overtime_pay + earn.bonus + earn.commission).quantize(
            Decimal("0.01")
        )
        return (gross, overtime_pay.quantize(Decimal("0.01")))
