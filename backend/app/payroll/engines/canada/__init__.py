"""Canadian payroll engine — routes to year-specific implementations.

For now only 2026 exists. Future years (y2027, y2028) will be added as
CRA publishes updated formulas. A router will pick the right year based
on pay period end date.
"""
from .y2026.engine import CanadaPayrollEngine

__all__ = ["CanadaPayrollEngine"]
