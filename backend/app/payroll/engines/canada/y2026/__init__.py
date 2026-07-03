"""2026 tax year Canadian payroll engine.

Based on:
- CRA T4127 Payroll Deductions Formulas (123rd Edition, effective July 1, 2026)
- CRA CSV data files in ~/novala/backend/cra/2026/

To create y2027: copy this folder to y2027, update the rate constants
using the 2027 CRA CSVs, run the test suite against PDOC-verified values.
"""
from .engine import CanadaPayrollEngine

__all__ = ["CanadaPayrollEngine"]
