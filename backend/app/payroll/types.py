"""Type definitions for the multi-country payroll engine.

Every country engine accepts PayCalculationInput and returns
PayCalculationResult. This is the contract.
"""

from decimal import Decimal
from datetime import date
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class EmployeeContext(BaseModel):
    """Per-employee data needed for calculation."""

    employee_id: str

    # Tax filing inputs (country-specific subsets)
    td1_federal_code: Optional[int] = None
    td1_provincial_code: Optional[int] = None
    w4_filing_status: Optional[str] = None
    w4_dependents: Optional[int] = None
    ni_category: Optional[str] = None

    # Catch-all for less common country-specific tax info
    tax_info: Dict[str, Any] = Field(default_factory=dict)

    # Exemption flags
    cpp_exempt: bool = False
    ei_exempt: bool = False
    fica_exempt: bool = False

    # Manual extras
    additional_withholding: Decimal = Decimal("0")
    vacation_pay_pct: Decimal = Decimal("4.0")


class YTDContext(BaseModel):
    """Year-to-date amounts BEFORE the pay period being calculated."""

    tax_year: int

    ytd_gross: Decimal = Decimal("0")
    ytd_federal_tax: Decimal = Decimal("0")
    ytd_provincial_or_state_tax: Decimal = Decimal("0")
    ytd_social_security_employee: Decimal = Decimal("0")
    ytd_social_security_employer: Decimal = Decimal("0")
    ytd_unemployment_employee: Decimal = Decimal("0")
    ytd_unemployment_employer: Decimal = Decimal("0")
    ytd_pensionable_earnings: Decimal = Decimal("0")
    ytd_insurable_earnings: Decimal = Decimal("0")


class HoursWorked(BaseModel):
    """Hour breakdown for one employee in one pay period."""

    regular: Decimal = Decimal("0")
    overtime: Decimal = Decimal("0")
    stat_holiday: Decimal = Decimal("0")
    vacation: Decimal = Decimal("0")
    sick: Decimal = Decimal("0")
    evening: Decimal = Decimal("0")
    overnight: Decimal = Decimal("0")
    weekend: Decimal = Decimal("0")
    on_call: Decimal = Decimal("0")
    travel: Decimal = Decimal("0")


class EarningsInput(BaseModel):
    """Earnings inputs for one employee in one pay period."""

    pay_type: str  # 'hourly' or 'salary'
    hourly_rate: Optional[Decimal] = None
    salary_amount: Decimal = Decimal("0")
    hours: HoursWorked = Field(default_factory=HoursWorked)

    bonus: Decimal = Decimal("0")
    commission: Decimal = Decimal("0")
    reimbursement: Decimal = Decimal("0")  # not taxed


class JurisdictionContext(BaseModel):
    """Where this pay is calculated."""

    country: str  # ISO2: CA, US, GB, AU, DE
    subnational: Optional[str] = None  # AB, ON, CA-state-code
    pay_period_start: date
    pay_period_end: date
    pay_date: date
    pay_periods_per_year: int  # 12, 24, 26, 52


class PayCalculationInput(BaseModel):
    """Full input to a country engine's calculate() method."""

    employee: EmployeeContext
    earnings: EarningsInput
    jurisdiction: JurisdictionContext
    ytd: YTDContext


class DeductionLine(BaseModel):
    """One deduction or contribution line on the audit trail."""

    name: str           # 'cpp', 'ei', 'federal_tax', 'alberta_tax'
    label: str          # 'CPP', 'EI', 'Federal Tax', 'Alberta Tax'
    amount: Decimal
    is_employer: bool = False

    base_amount: Optional[Decimal] = None
    rate: Optional[Decimal] = None
    notes: Optional[str] = None


class PayCalculationResult(BaseModel):
    """Output from a country engine's calculate() method."""

    gross_pay: Decimal

    # Employee deductions (country-agnostic naming)
    federal_tax: Decimal = Decimal("0")
    provincial_or_state_tax: Decimal = Decimal("0")
    local_tax: Decimal = Decimal("0")
    social_security_employee: Decimal = Decimal("0")
    social_security_2_employee: Decimal = Decimal("0")
    unemployment_employee: Decimal = Decimal("0")
    other_employee_deductions: Dict[str, Decimal] = Field(default_factory=dict)
    total_employee_deductions: Decimal

    # Employer contributions
    social_security_employer: Decimal = Decimal("0")
    unemployment_employer: Decimal = Decimal("0")
    workers_comp_employer: Decimal = Decimal("0")
    other_employer_contributions: Dict[str, Decimal] = Field(default_factory=dict)
    total_employer_contributions: Decimal

    # Net
    net_pay: Decimal

    # Full audit trail
    deduction_lines: List[DeductionLine]
    calculation_snapshot: Dict[str, Any]


# ============================================================
# Service-layer input types (used by orchestrator and API)
# ============================================================

class PayRunEmployeeInput(BaseModel):
    """Per-employee input for a pay run (from UI or import)."""

    employee_id: str
    hours: HoursWorked = Field(default_factory=HoursWorked)
    bonus: Decimal = Decimal("0")
    commission: Decimal = Decimal("0")
    reimbursement: Decimal = Decimal("0")


class CalculatedPayStub(BaseModel):
    """Compiled pay_stubs row data, ready for DB insert.

    Combines the PayCalculationResult with employee metadata so the
    persistence layer has everything in one shape.
    """
    employee_id: str
    pay_run_id: Optional[str] = None
    employee_name: str
    employee_email: Optional[str] = None
    position_title: Optional[str] = None
    pay_type: Optional[str] = None
    hourly_rate: Optional[Decimal] = None
    salary_amount: Decimal = Decimal("0")
    currency: str = "CAD"

    hours_regular: Decimal = Decimal("0")
    hours_overtime: Decimal = Decimal("0")
    hours_stat_holiday: Decimal = Decimal("0")
    hours_vacation: Decimal = Decimal("0")
    hours_sick: Decimal = Decimal("0")
    hours_evening: Decimal = Decimal("0")
    hours_overnight: Decimal = Decimal("0")
    hours_weekend: Decimal = Decimal("0")
    hours_on_call: Decimal = Decimal("0")
    hours_travel: Decimal = Decimal("0")

    gross_pay: Decimal
    bonus: Decimal = Decimal("0")
    commission: Decimal = Decimal("0")
    reimbursement: Decimal = Decimal("0")

    federal_tax: Decimal
    provincial_or_state_tax: Decimal
    local_tax: Decimal
    social_security_employee: Decimal
    social_security_2_employee: Decimal
    unemployment_employee: Decimal
    other_employee_deductions: Dict[str, Decimal]
    total_employee_deductions: Decimal

    social_security_employer: Decimal
    unemployment_employer: Decimal
    workers_comp_employer: Decimal
    other_employer_contributions: Dict[str, Decimal]
    total_employer_contributions: Decimal

    net_pay: Decimal

    calculation_snapshot: Dict[str, Any]


class PayRunPreviewResult(BaseModel):
    """Result of previewing or calculating a full pay run."""

    pay_run_id: Optional[str] = None
    total_gross: Decimal
    total_employee_deductions: Decimal
    total_employer_contributions: Decimal
    total_net: Decimal
    total_remittance_owed: Decimal  # employee deductions + employer contributions
    employee_count: int
    pay_stubs: List[CalculatedPayStub]

