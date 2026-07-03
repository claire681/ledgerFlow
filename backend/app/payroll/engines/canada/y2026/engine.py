"""Canadian payroll engine.

Implements PayrollEngine for Canada. Orchestrates:
- gross_pay computation from earnings
- CPP and CPP2 (cpp.py)
- EI (ei.py)
- Federal income tax (federal_tax.py)
- Provincial income tax (alberta.py, ontario.py, etc.)

Pure function. Result includes calculation_snapshot with everything
needed to reproduce the calculation later for audit or year-end forms.
"""

from decimal import Decimal
from typing import Optional

from ....types import (
    PayCalculationInput,
    PayCalculationResult,
    DeductionLine,
    EarningsInput,
)
from ....base import PayrollEngine
from . import cpp, ei, federal_tax, alberta


# province code -> tax calculator function
PROVINCIAL_TAX_HANDLERS = {
    "AB": alberta.calculate_alberta_tax,
    # ON, BC, MB, SK, NS, NB, PE, NL, NT, NU, YT, QC: to be added
}


class CanadaPayrollEngine(PayrollEngine):
    """Canadian payroll engine. Federal + provincial tax + CPP + EI."""

    country = "CA"

    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        emp = input.employee
        earn = input.earnings
        juris = input.jurisdiction
        ytd = input.ytd

        # 1. Compute taxable gross
        gross_pay = self._compute_gross(earn)

        # 2. CPP and CPP2
        cpp_employee, cpp2_employee, new_ytd_pensionable = cpp.calculate_cpp(
            gross_pay=gross_pay,
            ytd_pensionable_earnings=ytd.ytd_pensionable_earnings,
            pay_periods_per_year=juris.pay_periods_per_year,
            cpp_exempt=emp.cpp_exempt,
            province=juris.subnational,
        )
        cpp_employer = cpp_employee
        cpp2_employer = cpp2_employee

        # 3. EI
        ei_employee, ei_employer, new_ytd_insurable = ei.calculate_ei(
            gross_pay=gross_pay,
            ytd_insurable_earnings=ytd.ytd_insurable_earnings,
            ei_exempt=emp.ei_exempt,
            province=juris.subnational,
        )

        # 4. Federal income tax
        td1_fed_claim = (
            Decimal(str(emp.td1_federal_code))
            if emp.td1_federal_code is not None
            else federal_tax.BASIC_PERSONAL_AMOUNT_2026
        )
        fed_tax = federal_tax.calculate_federal_tax(
            gross_pay=gross_pay,
            pay_periods_per_year=juris.pay_periods_per_year,
            td1_federal_claim=td1_fed_claim,
            additional_withholding=emp.additional_withholding,
        )

        # 5. Provincial income tax
        prov_tax = self._calculate_provincial(
            gross_pay=gross_pay,
            province=juris.subnational,
            pay_periods_per_year=juris.pay_periods_per_year,
            td1_provincial_code=emp.td1_provincial_code,
        )

        # 6. Totals
        total_employee_deductions = (
            fed_tax + prov_tax + cpp_employee + cpp2_employee + ei_employee
        )
        total_employer_contributions = (
            cpp_employer + cpp2_employer + ei_employer
        )

        # 7. Net (reimbursement is non-taxed; added back)
        net_pay = gross_pay - total_employee_deductions + earn.reimbursement

        # 8. Deduction line items (audit trail)
        deduction_lines = [
            DeductionLine(name="federal_tax", label="Federal Tax", amount=fed_tax),
            DeductionLine(
                name="provincial_tax",
                label=f"{juris.subnational or 'Provincial'} Tax",
                amount=prov_tax,
            ),
            DeductionLine(name="cpp", label="CPP", amount=cpp_employee, rate=cpp.CPP_RATE),
            DeductionLine(name="cpp2", label="CPP2", amount=cpp2_employee, rate=cpp.CPP2_RATE),
            DeductionLine(name="ei", label="EI", amount=ei_employee, rate=ei.EI_RATE_EMPLOYEE_2026),
            DeductionLine(
                name="cpp_employer", label="CPP (Employer)",
                amount=cpp_employer, is_employer=True
            ),
            DeductionLine(
                name="cpp2_employer", label="CPP2 (Employer)",
                amount=cpp2_employer, is_employer=True
            ),
            DeductionLine(
                name="ei_employer", label="EI (Employer)",
                amount=ei_employer, is_employer=True
            ),
        ]

        # 9. Snapshot for reproducibility
        snapshot = {
            "engine": "CanadaPayrollEngine v1",
            "country": "CA",
            "subnational": juris.subnational,
            "tax_year": ytd.tax_year,
            "pay_periods_per_year": juris.pay_periods_per_year,
            "gross_pay": str(gross_pay),
            "cpp": {
                "rate": str(cpp.CPP_RATE),
                "ympe": str(cpp.YMPE_2026),
                "basic_exemption": str(cpp.BASIC_EXEMPTION),
                "employee": str(cpp_employee),
                "employer": str(cpp_employer),
                "ytd_pensionable_after": str(new_ytd_pensionable),
            },
            "cpp2": {
                "rate": str(cpp.CPP2_RATE),
                "yampe": str(cpp.YAMPE_2026),
                "employee": str(cpp2_employee),
                "employer": str(cpp2_employer),
            },
            "ei": {
                "rate_employee": str(ei.EI_RATE_EMPLOYEE_2026),
                "employer_multiplier": str(ei.EI_EMPLOYER_MULTIPLIER),
                "mie": str(ei.MAX_INSURABLE_EARNINGS_2026),
                "employee": str(ei_employee),
                "employer": str(ei_employer),
                "ytd_insurable_after": str(new_ytd_insurable),
            },
            "federal_tax": {
                "amount": str(fed_tax),
                "td1_claim": str(td1_fed_claim),
                "additional_withholding": str(emp.additional_withholding),
            },
            "provincial_tax": {
                "amount": str(prov_tax),
                "province": juris.subnational,
                "td1_claim": (
                    str(emp.td1_provincial_code)
                    if emp.td1_provincial_code is not None
                    else None
                ),
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
            provincial_or_state_tax=prov_tax,
            local_tax=Decimal("0"),
            social_security_employee=cpp_employee,
            social_security_2_employee=cpp2_employee,
            unemployment_employee=ei_employee,
            other_employee_deductions={},
            total_employee_deductions=total_employee_deductions,
            social_security_employer=cpp_employer + cpp2_employer,
            unemployment_employer=ei_employer,
            workers_comp_employer=Decimal("0"),
            other_employer_contributions={},
            total_employer_contributions=total_employer_contributions,
            net_pay=net_pay,
            deduction_lines=deduction_lines,
            calculation_snapshot=snapshot,
        )

    def _compute_gross(self, earn: EarningsInput) -> Decimal:
        """Compute taxable gross pay. Reimbursements excluded; added to net later."""
        if earn.pay_type == "salary":
            base = earn.salary_amount
        else:
            h = earn.hours
            rate = earn.hourly_rate or Decimal("0")

            # Regular-rate hours (premium policies layered later)
            regular_rate_hours = (
                h.regular + h.vacation + h.sick
                + h.evening + h.overnight + h.weekend
                + h.on_call + h.travel
            )

            # 1.5x rate: overtime + stat_holiday
            premium_hours = h.overtime + h.stat_holiday

            base = (regular_rate_hours * rate) + (premium_hours * rate * Decimal("1.5"))

        return (base + earn.bonus + earn.commission).quantize(Decimal("0.01"))

    def _calculate_provincial(
        self,
        gross_pay: Decimal,
        province: Optional[str],
        pay_periods_per_year: int,
        td1_provincial_code: Optional[int],
    ) -> Decimal:
        """Dispatch to provincial tax module. Returns 0 for QC (separate regime)
        and any province not yet implemented."""
        if not province or province == "QC":
            return Decimal("0")

        handler = PROVINCIAL_TAX_HANDLERS.get(province)
        if handler is None:
            return Decimal("0")

        kwargs = {
            "gross_pay": gross_pay,
            "pay_periods_per_year": pay_periods_per_year,
        }
        if td1_provincial_code is not None:
            kwargs["td1_provincial_claim"] = Decimal(str(td1_provincial_code))

        return handler(**kwargs)
