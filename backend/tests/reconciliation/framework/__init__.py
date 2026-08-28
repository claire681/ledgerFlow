"""Reconciliation test framework.

Country-agnostic infrastructure for reconciling Novala's payroll calculations
against every jurisdiction's official calculator (CRA PDOC, IRS, HMRC, ATO, ...).

Adding a new country:
1. Add scenarios in YAML at tests/reconciliation/<country>/scenarios/<region>_<year>.yaml
2. Add a country adapter function in framework/runner.py
3. Register it in COUNTRY_ADAPTERS
4. Add a pytest file that loads and parametrizes over the YAML

The framework itself does not change per country.
"""
from .comparators import Mismatch, compare, format_mismatches
from .loader import load_scenarios
from .runner import COUNTRY_ADAPTERS, ReconciliationResult, run_reconciliation
from .scenario import Scenario

__all__ = [
    "Scenario",
    "load_scenarios",
    "run_reconciliation",
    "ReconciliationResult",
    "COUNTRY_ADAPTERS",
    "Mismatch",
    "compare",
    "format_mismatches",
]
