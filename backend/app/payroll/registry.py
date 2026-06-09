"""Country to engine mapping. Single source of truth for which engine
handles which jurisdiction.

Each engine is instantiated once at import time and reused for all
calculations (engines are stateless pure functions).
"""

from typing import Optional
from .base import PayrollEngine
from .engines.canada import CanadaPayrollEngine
from .engines.uk import UKPayrollEngine
from .engines.australia import AustraliaPayrollEngine
from .engines.usa import USAPayrollEngine
from .engines.ireland import IrelandPayrollEngine


# ISO 3166-1 alpha-2 country codes
ENGINE_REGISTRY = {
    "CA": CanadaPayrollEngine(),
    "GB": UKPayrollEngine(),
    "UK": UKPayrollEngine(),  # alias
    "AU": AustraliaPayrollEngine(),
    "US": USAPayrollEngine(),
    "IE": IrelandPayrollEngine(),
}


def get_engine(country: str) -> PayrollEngine:
    """Return the engine for a country code. Raises ValueError if unsupported."""
    country = (country or "").upper()
    engine = ENGINE_REGISTRY.get(country)
    if engine is None:
        supported = ", ".join(sorted(set(ENGINE_REGISTRY.keys())))
        raise ValueError(
            f"No payroll engine registered for country '{country}'. "
            f"Supported: {supported}"
        )
    return engine


def is_supported(country: str) -> bool:
    """Check if a country is supported without raising."""
    return (country or "").upper() in ENGINE_REGISTRY
