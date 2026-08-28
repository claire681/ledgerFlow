"""Alberta payroll reconciliation tests.

Loads all scenarios from scenarios/ab_2026.yaml and runs each as a separate
pytest test. Adding a scenario to the YAML file automatically adds a test.

Run with:
    pytest tests/reconciliation/canada/test_alberta_reconciliation.py -v

Any single failure blocks the PR.
"""
from pathlib import Path

import pytest

from tests.reconciliation.framework import load_scenarios, run_reconciliation


SCENARIOS_PATH = Path(__file__).parent / "scenarios" / "ab_2026.yaml"
_SCENARIOS = load_scenarios(SCENARIOS_PATH)


@pytest.mark.parametrize("scenario", _SCENARIOS, ids=lambda s: s.id)
def test_alberta_pdoc_reconciliation(scenario):
    """Each Alberta scenario must match CRA PDOC exactly (to the penny)."""
    result = run_reconciliation(scenario)

    if result.error:
        pytest.fail(
            f"Scenario '{scenario.id}' errored: {result.error}\n"
            f"Verified against: {scenario.reconciled_against} "
            f"on {scenario.reconciled_date} by {scenario.reconciled_by}"
        )

    if not result.passed:
        details = "\n".join(m.format() for m in result.mismatches)
        pytest.fail(
            f"Scenario '{scenario.id}' does not match {scenario.reconciled_against}:\n"
            f"{details}\n\n"
            f"Verified against: {scenario.reconciled_against} "
            f"on {scenario.reconciled_date} by {scenario.reconciled_by}"
        )
