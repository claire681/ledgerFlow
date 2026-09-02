"""Layer 2 Monitoring — Continuous production reconciliation.

Framework designed for 5 layers of checks:
    Layer A: Sanity Bounds        [IMPLEMENTED]
    Layer B: Anomaly Detection    [FUTURE - needs 6mo historical data]
    Layer C: Reference Recalc     [FUTURE - needs second engine]
    Layer D: Multi-Source Cross   [FUTURE - needs enterprise partnerships]
    Layer E: Regulatory Filing    [FUTURE - needs quarterly cycle]

Public API:
    from app.reconciliation import reconcile_payroll
"""
from app.reconciliation.orchestrator import reconcile_payroll

__all__ = ["reconcile_payroll"]
