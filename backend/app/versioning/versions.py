"""API version metadata registry.

Update this file when releasing a new version or deprecating an old one.
"""
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class VersionInfo:
    version: str                    # "v1", "v2", etc.
    released_at: date               # when this version launched
    is_current: bool                # only ONE is current at a time
    deprecated: bool = False        # True = still works but new customers should use current
    sunset_date: Optional[date] = None  # when this version stops working
    notes: str = ""                 # human-readable changes


VERSIONS: list[VersionInfo] = [
    VersionInfo(
        version="v1",
        released_at=date(2026, 1, 1),
        is_current=True,
        deprecated=False,
        notes="Initial API. Payroll, employees, pay runs, feature flags, reconciliation.",
    ),
    # Future example:
    # VersionInfo(
    #     version="v2",
    #     released_at=date(2027, 1, 1),
    #     is_current=True,
    #     notes="Breaking: employee.tax_info restructured for multi-country support.",
    # ),
]


def current_version() -> VersionInfo:
    """Get the CURRENT (recommended) API version."""
    for v in VERSIONS:
        if v.is_current:
            return v
    raise RuntimeError("No current API version defined")


def all_versions() -> list[VersionInfo]:
    """All defined versions (including deprecated)."""
    return VERSIONS


def get_version_info(version: str) -> Optional[VersionInfo]:
    """Look up info for one version. Returns None if not found."""
    version = version.lower().strip()
    for v in VERSIONS:
        if v.version == version:
            return v
    return None
