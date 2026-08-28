"""YAML scenario loader.

Loads reconciliation test scenarios from YAML files into Scenario dataclass instances.

YAML is chosen over JSON because:
- Non-programmers (accountants, tax specialists) can add/edit scenarios
- Diff-friendly for code review
- Comments allowed inline (audit trail)
- Extensible per country without changing the loader

Uses safe_load to prevent arbitrary code execution.
"""
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import yaml

from .scenario import Scenario


def _to_decimal(value: Any) -> Decimal:
    """Convert YAML value (int, float, str) to Decimal safely.

    Uses str() to avoid floating-point precision loss.
    """
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _decimalize_dict(d: dict[str, Any] | None) -> dict[str, Decimal]:
    """Convert every value in a dict to Decimal (for expected/ytd dicts)."""
    if not d:
        return {}
    return {k: _to_decimal(v) for k, v in d.items()}


def _smart_decimalize(value: Any) -> Any:
    """Convert numeric values to Decimal; preserve bool/str/None/lists/dicts.

    bool must be checked BEFORE int because bool is a subclass of int in Python.
    Recurses into nested dicts.
    """
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {k: _smart_decimalize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_smart_decimalize(v) for v in value]
    return value


def _parse_date(value: Any) -> date:
    """Parse a YAML date value (may be date object, string, or datetime)."""
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return date.fromisoformat(value)
    raise ValueError(f"Cannot parse date from {value!r}")


def load_scenarios(path: Path | str) -> list[Scenario]:
    """Load all scenarios from a YAML file.

    YAML format:
        scenarios:
          - id: string
            jurisdiction: string
            tax_year: int
            reconciled_against: string
            reconciled_date: YYYY-MM-DD
            reconciled_by: string
            employee:
              age: int
              marital_status: string
            income:
              gross_per_period: decimal
              pay_frequency: string
              pay_periods_per_year: int
            country_specific: {...}
            ytd_at_start: {...}
            expected: {...}
            notes: string (optional)

    Returns a list of Scenario instances. Raises ValueError if YAML is malformed
    or any required field is missing.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Scenario file not found: {path}")

    with path.open("r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    if not raw or "scenarios" not in raw:
        raise ValueError(f"{path}: missing top-level 'scenarios' key")

    scenarios = []
    for i, raw_scenario in enumerate(raw["scenarios"]):
        try:
            scenario = _build_scenario(raw_scenario)
        except (KeyError, ValueError, TypeError) as e:
            raise ValueError(f"{path} scenario #{i + 1}: {e}") from e
        scenarios.append(scenario)

    # Enforce unique IDs within a file
    ids = [s.id for s in scenarios]
    duplicates = {i for i in ids if ids.count(i) > 1}
    if duplicates:
        raise ValueError(f"{path}: duplicate scenario IDs: {sorted(duplicates)}")

    return scenarios


def _build_scenario(raw: dict[str, Any]) -> Scenario:
    """Build a single Scenario from a raw YAML dict."""
    return Scenario(
        id=raw["id"],
        jurisdiction=raw["jurisdiction"],
        tax_year=int(raw["tax_year"]),
        reconciled_against=raw["reconciled_against"],
        reconciled_date=_parse_date(raw["reconciled_date"]),
        reconciled_by=raw["reconciled_by"],
        employee_age=int(raw["employee"]["age"]),
        employee_marital_status=raw["employee"]["marital_status"],
        gross_per_period=_to_decimal(raw["income"]["gross_per_period"]),
        pay_frequency=raw["income"]["pay_frequency"],
        pay_periods_per_year=int(raw["income"]["pay_periods_per_year"]),
        country_specific=_smart_decimalize(raw.get("country_specific", {}) or {}),
        ytd_at_start=_decimalize_dict(raw.get("ytd_at_start")),
        expected=_decimalize_dict(raw.get("expected")),
        notes=raw.get("notes", "") or "",
    )
