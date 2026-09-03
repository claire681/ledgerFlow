"""Reconciliation orchestrator - runs all registered checkers and logs results.

This is the ONLY function you call from payroll code. Everything else is internal.

Usage:
    from app.reconciliation import reconcile_payroll
    await reconcile_payroll(engine_result, input_data, customer_id=cid)

Runs async so it never blocks payroll calculation. If any checker fails or
finds a mismatch, results are logged to reconciliation_runs table.
"""
import uuid
from decimal import Decimal
from typing import Any, Optional
from datetime import date

from app.db.database import AsyncSessionLocal
from app.models.models import ReconciliationRun, ReconciliationMismatch
from app.reconciliation.base import BaseChecker, CheckerResult
from app.reconciliation.checkers import SanityChecker
from app.reconciliation.alerting import alert_critical_mismatch


# Registry of all active checkers. Add new layers here.
# Future: this could be loaded from DB / feature flags to enable checkers per-customer
_CHECKERS: list[BaseChecker] = [
    SanityChecker(),
    # SanityChecker() - Layer A: IMPLEMENTED
    # AnomalyChecker() - Layer B: FUTURE
    # ReferenceRecalcChecker() - Layer C: FUTURE
    # MultiSourceChecker() - Layer D: FUTURE
    # RegulatoryFilingChecker() - Layer E: FUTURE
]


async def reconcile_payroll(
    engine_result: dict[str, Any],
    input_data: dict[str, Any],
    pay_stub_id: Optional[uuid.UUID] = None,
    customer_id: Optional[uuid.UUID] = None,
) -> Optional[uuid.UUID]:
    """Run all registered checkers and log results.

    Args:
        engine_result: Payroll engine's calculated output
        input_data: Original inputs (must include: country, subnational, tax_year, gross_pay)
        pay_stub_id: Optional link to pay_stubs table
        customer_id: Optional link to users table

    Returns:
        UUID of the ReconciliationRun row (None if error prevented logging)
    """
    all_mismatches = []
    engine_version = "CanadaPayrollEngine v1"

    # Run all checkers - each is independent
    for checker in _CHECKERS:
        try:
            result: CheckerResult = await checker.check(engine_result, input_data)
            all_mismatches.extend(result.mismatches)
        except Exception:
            # A checker crashing must NEVER break payroll
            # Log the crash but continue
            continue

    total_diff_cents = sum(abs(m.diff_cents) for m in all_mismatches)
    passed = len(all_mismatches) == 0

    # Persist the reconciliation run
    try:
        async with AsyncSessionLocal() as db:
            run = ReconciliationRun(
                id=uuid.uuid4(),
                pay_stub_id=pay_stub_id,
                customer_id=customer_id,
                country=input_data.get("country", "??"),
                subnational=input_data.get("subnational"),
                tax_year=int(input_data.get("tax_year", 2026)),
                engine_version=engine_version,
                gross_pay=Decimal(str(engine_result.get("gross_pay", 0))),
                passed=passed,
                mismatch_count=len(all_mismatches),
                total_diff_cents=total_diff_cents,
                payroll_snapshot=_decimals_to_str(engine_result),
                reference_snapshot={"checkers_run": [c.name for c in _CHECKERS]},
            )
            db.add(run)
            await db.flush()

            # Persist individual mismatches
            for m in all_mismatches:
                mismatch = ReconciliationMismatch(
                    id=uuid.uuid4(),
                    run_id=run.id,
                    field_name=m.field_name,
                    expected_value=m.expected_value,
                    actual_value=m.actual_value,
                    diff_cents=m.diff_cents,
                    severity=m.severity,
                )
                db.add(mismatch)

            await db.commit()

            # Fire alerts for critical mismatches (non-blocking)
            if any(m.severity == "critical" for m in all_mismatches):
                try:
                    await alert_critical_mismatch(run.id)
                except Exception:
                    pass  # never let alerting break payroll

            return run.id

    except Exception:
        # DB write failing must NEVER break payroll
        return None


def _decimals_to_str(d: dict) -> dict:
    """Convert Decimal values to strings for JSONB storage."""
    result = {}
    for k, v in d.items():
        if isinstance(v, Decimal):
            result[k] = str(v)
        elif isinstance(v, dict):
            result[k] = _decimals_to_str(v)
        else:
            result[k] = v
    return result
