"""Reconciliation runner.

Takes a generic Scenario, invokes the correct country's payroll engine,
compares the result to the expected values, and returns a ReconciliationResult.

Adding a new country means:
1. Add a country_specific adapter function below (see _canada_adapter as example)
2. Register it in COUNTRY_ADAPTERS

The rest of the framework (loader, comparators, pytest wiring) needs no changes.
"""
from dataclasses import dataclass
from decimal import Decimal
from typing import Callable

from .comparators import Mismatch, compare, format_mismatches
from .scenario import Scenario


@dataclass
class ReconciliationResult:
    """Outcome of running one scenario against Novala's engine."""
    scenario_id: str
    jurisdiction: str
    passed: bool
    mismatches: list[Mismatch]
    error: str | None = None

    def format(self) -> str:
        if self.error:
            return f"[{self.scenario_id}] ERROR: {self.error}"
        if self.passed:
            return f"[{self.scenario_id}] PASS"
        return f"[{self.scenario_id}] FAIL:\n{format_mismatches(self.mismatches)}"


# ---------------------------------------------------------------------------
# Country adapters
#
# Each function takes a Scenario and returns:
#   - A dict of actual values (keyed like the scenario's expected dict) that
#     the runner will compare against scenario.expected.
#
# Adapters translate between Novala's country-specific engine APIs and the
# generic scenario schema. This is intentionally per-country because every
# country's payroll engine has different inputs and outputs.
# ---------------------------------------------------------------------------

def _canada_adapter(scenario: Scenario) -> dict[str, Decimal]:
    """Run a Canadian scenario through Novala's Canada engine.

    Calls the real y2026 engine functions with their actual signatures
    (matched to the working legacy test_matrix.py). Returns a dict keyed
    like the scenario's `expected` dict for comparison.
    """
    # Import here (not at module top) so this file loads even if payroll engines
    # move around during refactor - errors surface at test time, not import time.
    from app.payroll.engines.canada.y2026 import cpp, ei, federal_tax, alberta, ontario

    region = scenario.region_code
    cs = scenario.country_specific
    ytd = scenario.ytd_at_start

    # CPP - returns 3-tuple (cpp, cpp2, pensionable_used)
    cpp_amt, cpp2_amt, _ = cpp.calculate_cpp(
        gross_pay=scenario.gross_per_period,
        ytd_pensionable_earnings=ytd.get("pensionable_earnings", Decimal("0")),
        pay_periods_per_year=scenario.pay_periods_per_year,
        pensionable_months=int(cs.get("pensionable_months", 12)),
        ytd_cpp_paid=ytd.get("cpp_base_paid", Decimal("0")),
        ytd_cpp2_paid=ytd.get("cpp2_paid", Decimal("0")),
        cpp_exempt=bool(cs.get("cpp_exempt", False)),
        province=region,
    )

    # EI - returns 3-tuple (employee, employer, insurable_used)
    ei_amt, _ei_employer, _ = ei.calculate_ei(
        gross_pay=scenario.gross_per_period,
        ytd_insurable_earnings=ytd.get("insurable_earnings", Decimal("0")),
        ei_exempt=bool(cs.get("ei_exempt", False)),
        province=region,
        ytd_ei_paid=ytd.get("ei_paid", Decimal("0")),
    )

    additional_withholding = Decimal(str(cs.get("additional_withholding", 0)))

    # Federal tax
    fed_tax = federal_tax.calculate_federal_tax(
        gross_pay=scenario.gross_per_period,
        pay_periods_per_year=scenario.pay_periods_per_year,
        td1_federal_claim=cs.get("td1_federal_claim"),
        additional_withholding=additional_withholding,
        cpp_contribution=cpp_amt,
        ei_contribution=ei_amt,
        ytd_cpp_base=ytd.get("cpp_base_paid", Decimal("0")),
        ytd_ei=ytd.get("ei_paid", Decimal("0")),
        cpp2_contribution=cpp2_amt,
        pensionable_months=int(cs.get("pensionable_months", 12)),
    )

    # Provincial tax - route to correct handler by region
    provincial_handlers = {
        "AB": alberta.calculate_alberta_tax,
        "ON": ontario.calculate_ontario_tax,
    }
    handler = provincial_handlers.get(region)
    if handler is None:
        raise ValueError(
            f"No Canadian provincial tax handler for region '{region}'. "
            f"Supported: {sorted(provincial_handlers.keys())}"
        )

    prov_tax = handler(
        gross_pay=scenario.gross_per_period,
        pay_periods_per_year=scenario.pay_periods_per_year,
        td1_provincial_claim=cs.get("td1_provincial_claim"),
        cpp_contribution=cpp_amt,
        ei_contribution=ei_amt,
        ytd_cpp_base=ytd.get("cpp_base_paid", Decimal("0")),
        ytd_ei=ytd.get("ei_paid", Decimal("0")),
        cpp2_contribution=cpp2_amt,
        pensionable_months=int(cs.get("pensionable_months", 12)),
    )

    # Net pay
    total_deductions = fed_tax + prov_tax + cpp_amt + cpp2_amt + ei_amt
    net = scenario.gross_per_period - total_deductions - additional_withholding

    return {
        "cpp": cpp_amt,
        "cpp2": cpp2_amt,
        "ei": ei_amt,
        "federal_tax": fed_tax,
        "provincial_tax": prov_tax,
        "net_pay": net,
    }

# Registry: country_code -> adapter function
# Add new countries here as they come online. Each adapter is self-contained
# and only imported when that country's tests run.
COUNTRY_ADAPTERS: dict[str, Callable[[Scenario], dict[str, Decimal]]] = {
    "CA": _canada_adapter,
    # "US": _usa_adapter,     # Phase 7
    # "GB": _uk_adapter,      # Phase 7
    # "AU": _australia_adapter, # Phase 7
    # ... etc.
}


def run_reconciliation(scenario: Scenario) -> ReconciliationResult:
    """Run one scenario and compare its result to expected values.

    Never raises — always returns a ReconciliationResult. On any error (missing
    adapter, engine exception, etc.) the result has passed=False and error set.
    """
    country = scenario.country_code
    adapter = COUNTRY_ADAPTERS.get(country)
    if adapter is None:
        return ReconciliationResult(
            scenario_id=scenario.id,
            jurisdiction=scenario.jurisdiction,
            passed=False,
            mismatches=[],
            error=(
                f"No reconciliation adapter for country '{country}'. "
                f"Add it to COUNTRY_ADAPTERS in framework/runner.py. "
                f"Registered: {sorted(COUNTRY_ADAPTERS.keys())}"
            ),
        )

    try:
        actual = adapter(scenario)
    except Exception as exc:
        return ReconciliationResult(
            scenario_id=scenario.id,
            jurisdiction=scenario.jurisdiction,
            passed=False,
            mismatches=[],
            error=f"Adapter raised {type(exc).__name__}: {exc}",
        )

    mismatches = compare(scenario.expected, actual, tolerance=Decimal(scenario.tolerance_cents) / Decimal("100"))
    return ReconciliationResult(
        scenario_id=scenario.id,
        jurisdiction=scenario.jurisdiction,
        passed=len(mismatches) == 0,
        mismatches=mismatches,
    )
