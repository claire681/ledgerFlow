"""Decimal comparison helpers for reconciliation.

Payroll numbers must match to the penny. This module provides configurable
comparison so we can be strict by default but tolerant when appropriate
(e.g. some jurisdictions round differently at intermediate steps).
"""
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional


DEFAULT_TOLERANCE = Decimal("0.00")  # Strict: exact penny match required


@dataclass
class Mismatch:
    """One field's expected vs. actual value mismatch."""
    field: str
    expected: Decimal
    actual: Decimal

    @property
    def diff(self) -> Decimal:
        return self.actual - self.expected

    def format(self) -> str:
        return (
            f"  {self.field}: expected {self.expected}, got {self.actual} "
            f"(diff: {self.diff:+})"
        )


def compare(
    expected: dict[str, Decimal],
    actual: dict[str, Decimal],
    tolerance: Decimal = DEFAULT_TOLERANCE,
) -> list[Mismatch]:
    """Compare every field in expected against actual, penny-precise.

    Returns a list of Mismatch objects (empty if all match).

    Args:
        expected: what the official calculator says
        actual: what Novala's engine produced
        tolerance: acceptable difference (default 0.00 = exact match required)

    Only fields present in `expected` are checked. Extra fields in `actual`
    are ignored (Novala may compute more than the expected asserts).
    Missing fields in `actual` are treated as mismatches.
    """
    mismatches = []
    for field, expected_value in expected.items():
        expected_decimal = Decimal(str(expected_value))
        if field not in actual:
            mismatches.append(Mismatch(
                field=field,
                expected=expected_decimal,
                actual=Decimal("0"),
            ))
            continue
        actual_decimal = Decimal(str(actual[field]))
        diff = abs(actual_decimal - expected_decimal)
        if diff > tolerance:
            mismatches.append(Mismatch(
                field=field,
                expected=expected_decimal,
                actual=actual_decimal,
            ))
    return mismatches


def format_mismatches(mismatches: list[Mismatch]) -> str:
    """Format a list of mismatches as a human-readable string for test output."""
    if not mismatches:
        return ""
    return "\n".join(m.format() for m in mismatches)
