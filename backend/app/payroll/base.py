"""Abstract base class for country-specific payroll engines.

Each country implements this contract. The orchestration layer doesn't
care which country runs; it calls .calculate(input) and gets a result.
"""

from abc import ABC, abstractmethod
from typing import Optional
from .types import PayCalculationInput, PayCalculationResult


class PayrollEngine(ABC):
    """Contract every country engine implements."""

    country: str  # Set by subclass: 'CA', 'US', 'GB', 'AU', 'DE'

    @abstractmethod
    def calculate(self, input: PayCalculationInput) -> PayCalculationResult:
        """Calculate one employees pay for one pay period.

        Must be a pure function. Same input -> same output. No I/O, no DB,
        no clock reads. The calculation_snapshot must contain everything
        needed to reproduce this exact calculation later for audit or
        year-end forms.
        """
        raise NotImplementedError

    def supports_jurisdiction(self, country: str, subnational: Optional[str] = None) -> bool:
        """Return True if this engine handles the given jurisdiction."""
        return country == self.country
