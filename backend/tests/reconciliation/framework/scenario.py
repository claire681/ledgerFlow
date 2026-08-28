"""Generic Scenario dataclass — country-agnostic reconciliation test data.

Every reconciliation scenario, in any country, is an instance of this class.

Country-specific fields (Canada's TD1 codes, US's W-4 status, UK's tax code, etc.)
go in the free-form `country_specific` dict. Country-specific expected results
(CPP for Canada, FICA for US, NI for UK, etc.) go in the free-form `expected` dict.

This design lets us add a new country by writing a YAML file — no changes needed
to this class or any framework code.
"""
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any, Optional


@dataclass
class Scenario:
    """One reconciliation test scenario, verified against an official calculator."""

    # Identity
    id: str                                        # Unique, e.g. "ab_2026_low_income_biweekly"
    jurisdiction: str                              # ISO 3166-2, e.g. "CA-AB", "US-CA", "GB-ENG"
    tax_year: int                                  # e.g. 2026

    # Provenance (audit trail for reconciliation history)
    reconciled_against: str                        # Authority name, e.g. "CRA_PDOC", "IRS_W4_CALC"
    reconciled_date: date                          # When last verified
    reconciled_by: str                             # Who verified

    # Employee attributes (country-agnostic)
    employee_age: int
    employee_marital_status: str                   # "single" | "married" | "common_law" | "divorced" | "widowed"

    # Income (country-agnostic)
    gross_per_period: Decimal
    pay_frequency: str                             # "weekly" | "biweekly" | "semi_monthly" | "monthly"
    pay_periods_per_year: int

    # Country-specific inputs (each country's YAML puts what it needs)
    country_specific: dict[str, Any] = field(default_factory=dict)

    # Year-to-date at start of this period
    ytd_at_start: dict[str, Decimal] = field(default_factory=dict)

    # Expected results from the official calculator (each country puts what it produces)
    expected: dict[str, Decimal] = field(default_factory=dict)

    # Optional context
    notes: str = ""

    @property
    def country_code(self) -> str:
        """ISO 3166-1 alpha-2 country from jurisdiction (e.g. 'CA' from 'CA-AB')."""
        return self.jurisdiction.split("-")[0].upper()

    @property
    def region_code(self) -> Optional[str]:
        """ISO 3166-2 subdivision from jurisdiction (e.g. 'AB' from 'CA-AB'). None if country-level only."""
        parts = self.jurisdiction.split("-", 1)
        if len(parts) == 2:
            return parts[1].upper()
        return None
