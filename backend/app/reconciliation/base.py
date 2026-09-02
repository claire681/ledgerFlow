"""Base checker interface for the reconciliation framework."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any


@dataclass
class Mismatch:
    field_name: str
    expected_value: Decimal
    actual_value: Decimal
    diff_cents: int
    severity: str = "warning"
    reason: str = ""


@dataclass
class CheckerResult:
    checker_name: str
    layer: str
    passed: bool
    mismatches: list[Mismatch] = field(default_factory=list)
    duration_ms: float = 0.0
    error: str | None = None


class BaseChecker(ABC):
    layer: str = ""
    name: str = ""
    description: str = ""

    @abstractmethod
    async def check(self, engine_result: dict[str, Any], input_data: dict[str, Any]) -> CheckerResult:
        raise NotImplementedError

    def _make_result(self, mismatches=None, duration_ms=0.0, error=None):
        return CheckerResult(
            checker_name=self.name,
            layer=self.layer,
            passed=(not mismatches and error is None),
            mismatches=mismatches or [],
            duration_ms=duration_ms,
            error=error,
        )
