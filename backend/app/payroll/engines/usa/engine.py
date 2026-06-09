"""USA payroll engine.

Implements PayrollEngine for the United States.

Orchestrates:
- Federal income tax (federal_tax.py)
- FICA: SS + Medicare + Additional Medicare (fica.py)
- FUTA: Federal Unemployment (futa.py) - employer only
- State income tax (states/*.py): CA, IL, TX, plus 8 no-tax states

Pure function. Result includes calculation_snapshot for audit.

47 unimplemented states (everything except CA, IL, plus 9 no-tax states)
return 0 state tax with a flag in the snapshot.
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
from . import federal_tax, fica, futa
from .states import california, illinois, texas


# state code -> tax handler function
STATE_TAX_HANDLERS = {
    "CA": california.calculate_california_tax,
    "IL": illinois.calculate_illinois_tax,
    # 9 states with no income tax all use texas handler
    "TX": texas.calculate_texas_tax,
    "AK": texas.calculate_texas_tax,
    "FL": texas.calculate_texas_tax,
    "NV": texas.calculate_texas_tax,
    "NH": texas.calculate_texas_tax,
    "SD": texas.calculate_texas_tax,
    "TN": texas.calculate_texas_tax,
    "WA": texas.calculate_texas_tax,
    "WY": texas.calculate_texas_tax,
}


class USAPayrollEngine(PayrollEngine):
    """US payroll engine. Federal + FICA + FUTA + state."""

    country = "US"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        emp = input.employee
        earn = input.earnings
        juris = input.jurisdiction
        ytd = input.ytd

        # 1. Gross
        gross_pay = self._compute_gross(earn)

        # 2. Federal income tax
        filing_status = emp.w4_filing_status or "single"
        qualifying_children = emp.tax_info.get("qualifying_children", 0)
        other_dependents = emp.tax_info.get("other_dependents", 0)
        fed_tax = federal_tax.calculate_federal_tax(
            gross_pay=gross_pay,
            pay_periods_per_year=juris.pay_periods_per_year,
            filing_status=filing_status,
            qualifying_children=qualifying_children,
            other_dependents=other_dependents,
            additional_withholding=emp.additional_withholding,
        )

        # 3. FICA
        fica_result = fica.calculate_fica(
            gross_pay=gross_pay,
            ytd_ss_wages=ytd.ytd_pensionable_earnings,
            ytd_medicare_wages=ytd.ytd_insurable_earnings,
            fica_exempt=emp.fica_exempt,
        )

        # 4. FUTA (approximate ytd from ytd_gross capped at FUTA base)
        futa_amount, _ = futa.calculate_futa(
            gross_pay=gross_pay,
            ytd_futa_wages=min(ytd.ytd_gross, futa.FUTA_WAGE_BASE),
        )

        # 5. State income tax
        state_implemented = juris.subnational in STATE_TAX_HANDLERS
        state_tax = self._calculate_state(
            state=juris.subnational,
            gross_pay=gross_pay,
            pay_periods_per_year=juris.pay_periods_per_year,
            filing_status=filing_status,
        )

        # 6. Totals
        employee_ss = fica_result["ss_employee"]
        employee_medicare = fica_result["medicare_employee"]
        employee_addl_medicare = fica_result["additional_medicare"]

        total_employee_deductions = (
            fed_tax + state_tax + employee_ss
            + employee_medicare + employee_addl_medicare
        )
        total_employer_contributions = (
            fica_result["ss_employer"] + fica_result["medicare_employer"] + futa_amount
        )

        # 7. Net
        net_pay = gross_pay - total_employee_deductions + earn.reimbursement

        # 8. Deduction lines
        deduction_lines = [
            DeductionLine(
                name="federal_tax", label="Federal Income Tax", amount=fed_tax,
                notes=f"Filing status: {filing_status}",
            ),
            DeductionLine(
                name="state_tax",
                label=f"{juris.subnational or 'State'} Income Tax",
                amount=state_tax,
            ),
            DeductionLine(
                name="social_security", label="Social Security",
                amount=employee_ss, rate=fica.SS_RATE,
            ),
            DeductionLine(
                name="medicare", label="Medicare",
                amount=employee_medicare, rate=fica.MEDICARE_RATE,
            ),
        ]
        if employee_addl_medicare > 0:
            deduction_lines.append(DeductionLine(
                name="additional_medicare",
                label="Additional Medicare Tax",
                amount=employee_addl_medicare,
                rate=fica.ADDITIONAL_MEDICARE_RATE,
            ))
        deduction_lines.extend([
            DeductionLine(
                name="ss_employer", label="Social Security (Employer)",
                amount=fica_result["ss_employer"], is_employer=True,
            ),
            DeductionLine(
                name="medicare_employer", label="Medicare (Employer)",
                amount=fica_result["medicare_employer"], is_employer=True,
            ),
            DeductionLine(
                name="futa", label="FUTA (Employer)",
                amount=futa_amount, is_employer=True,
                rate=futa.FUTA_EFFECTIVE_RATE,
            ),
        ])

        # 9. Snapshot
        snapshot = {
            "engine": "USAPayrollEngine v1",
            "country": "US",
            "subnational": juris.subnational,
            "state_implemented": state_implemented,
            "tax_year": ytd.tax_year,
            "pay_periods_per_year": juris.pay_periods_per_year,
            "gross_pay": str(gross_pay),
            "federal_tax": {
                "amount": str(fed_tax),
                "filing_status": filing_status,
                "qualifying_children": qualifying_children,
                "other_dependents": other_dependents,
                "additional_withholding": str(emp.additional_withholding),
            },
            "fica": {
                "ss_rate": str(fica.SS_RATE),
                "ss_wage_base": str(fica.SS_WAGE_BASE_2026),
                "medicare_rate": str(fica.MEDICARE_RATE),
                "additional_medicare_rate": str(fica.ADDITIONAL_MEDICARE_RATE),
                "ss_employee": str(employee_ss),
                "ss_employer": str(fica_result["ss_employer"]),
                "medicare_employee": str(employee_medicare),
                "medicare_employer": str(fica_result["medicare_employer"]),
                "additional_medicare": str(employee_addl_medicare),
                "new_ytd_ss": str(fica_result["new_ytd_ss"]),
                "new_ytd_medicare": str(fica_result["new_ytd_medicare"]),
            },
            "futa": {
                "rate": str(futa.FUTA_EFFECTIVE_RATE),
                "wage_base": str(futa.FUTA_WAGE_BASE),
                "amount": str(futa_amount),
            },
            "state_tax": {
                "state": juris.subnational,
                "implemented": state_implemented,
                "amount": str(state_tax),
            },
            "totals": {
                "total_employee_deductions": str(total_employee_deductions),
                "total_employer_contributions": str(total_employer_contributions),
                "net_pay": str(net_pay),
            },
        }

        return PayCalculationResult(
            gross_pay=gross_pay,
            federal_tax=fed_tax,
            provincial_or_state_tax=state_tax,
            local_tax=Decimal("0"),
            social_security_employee=employee_ss,
            social_security_2_employee=employee_addl_medicare,
            unemployment_employee=Decimal("0"),
            other_employee_deductions={"medicare": employee_medicare},
            total_employee_deductions=total_employee_deductions,
            social_security_employer=fica_result["ss_employer"],
            unemployment_employer=futa_amount,
            workers_comp_employer=Decimal("0"),
            other_employer_contributions={
                "medicare_employer": fica_result["medicare_employer"],
            },
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

    def _calculate_state(
        self,
        state: Optional[str],
        gross_pay: Decimal,
        pay_periods_per_year: int,
        filing_status: str,
    ) -> Decimal:
        if not state:
            return Decimal("0")
        handler = STATE_TAX_HANDLERS.get(state)
        if handler is None:
            return Decimal("0")
        return handler(
            gross_pay=gross_pay,
            pay_periods_per_year=pay_periods_per_year,
            filing_status=filing_status,
        )
