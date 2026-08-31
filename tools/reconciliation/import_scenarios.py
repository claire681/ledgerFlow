#!/usr/bin/env python3
"""Batch import reconciliation scenarios from CSV to YAML.

Usage: python3 import_scenarios.py <csv_path>

The CSV must have these input columns (auto-generated from CRA PDOC):
- id, category, pay_frequency, pay_periods_per_year, gross_per_period
- td1_federal_claim, td1_provincial_claim, pensionable_months
- ytd_pensionable_earnings, ytd_insurable_earnings
- ytd_cpp_base_paid, ytd_ei_paid

And these expected columns (filled in by user after running CRA PDOC):
- expected_cpp, expected_cpp2, expected_ei
- expected_federal_tax, expected_provincial_tax, expected_net_pay

Only rows with ALL expected columns filled in are imported.
Rows with blank expected fields are skipped (not yet reconciled).

Run from ~/novala.
"""
import csv
import sys
from pathlib import Path
from datetime import date

YAML_FILE = Path("backend/tests/reconciliation/canada/scenarios/ab_2026.yaml")

if len(sys.argv) != 2:
    print("Usage: python3 import_scenarios.py <csv_path>")
    sys.exit(1)

CSV_FILE = Path(sys.argv[1])
if not CSV_FILE.exists():
    print(f"ERROR: {CSV_FILE} not found")
    sys.exit(1)

if not YAML_FILE.exists():
    print(f"ERROR: {YAML_FILE} not found. Run from ~/novala.")
    sys.exit(1)

# Backup YAML
BACKUP = YAML_FILE.with_suffix(f".yaml.bak.batch-import")
BACKUP.write_text(YAML_FILE.read_text())
print(f"Backed up YAML to {BACKUP}")

# Read existing YAML to find already-imported scenario IDs
existing_content = YAML_FILE.read_text()

# Read CSV
scenarios = []
skipped_blank = []
skipped_existing = []

with open(CSV_FILE) as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Check if expected fields are filled in
        expected_cols = ['expected_cpp', 'expected_cpp2', 'expected_ei',
                         'expected_federal_tax', 'expected_provincial_tax',
                         'expected_net_pay']
        missing = [c for c in expected_cols if not row.get(c, '').strip()]
        if missing:
            skipped_blank.append(row['id'])
            continue

        # Check if already in YAML
        if f"id: {row['id']}" in existing_content:
            skipped_existing.append(row['id'])
            continue

        scenarios.append(row)

print(f"Found {len(scenarios)} scenarios ready to import")
print(f"Skipped {len(skipped_blank)} rows (expected fields blank - not yet reconciled)")
print(f"Skipped {len(skipped_existing)} rows (already in YAML)")

if not scenarios:
    print("\nNothing to import. Fill in expected_ columns in the CSV first.")
    sys.exit(0)

# Generate YAML for new scenarios
today = date.today().isoformat()
new_yaml_blocks = []

for s in scenarios:
    block = f"""  # ============================================================
  # {s['id']} - {s['category']}
  # ============================================================
  - id: {s['id']}
    jurisdiction: CA-AB
    tax_year: 2026
    reconciled_against: CRA_PDOC
    reconciled_date: {today}
    reconciled_by: Claire (BrightCare)
    notes: >
      Category: {s['category']}. Batch imported from CSV.
    employee:
      age: 35
      marital_status: single
    income:
      gross_per_period: {float(s['gross_per_period']):.2f}
      pay_frequency: {s['pay_frequency']}
      pay_periods_per_year: {s['pay_periods_per_year']}
    country_specific:
      td1_federal_claim: {float(s['td1_federal_claim']):.2f}
      td1_provincial_claim: {float(s['td1_provincial_claim']):.2f}
      cpp_exempt: false
      ei_exempt: false
      additional_withholding: 0.00
    ytd_at_start:
      pensionable_earnings: {float(s['ytd_pensionable_earnings']):.2f}
      insurable_earnings: {float(s['ytd_insurable_earnings']):.2f}
      cpp_base_paid: {float(s['ytd_cpp_base_paid']):.2f}
      ei_paid: {float(s['ytd_ei_paid']):.2f}
    expected:
      cpp: {float(s['expected_cpp']):.2f}
      cpp2: {float(s['expected_cpp2']):.2f}
      ei: {float(s['expected_ei']):.2f}
      federal_tax: {float(s['expected_federal_tax']):.2f}
      provincial_tax: {float(s['expected_provincial_tax']):.2f}
      net_pay: {float(s['expected_net_pay']):.2f}
"""
    new_yaml_blocks.append(block)

# Append to YAML
new_content = existing_content.rstrip() + "\n" + "".join(new_yaml_blocks)
YAML_FILE.write_text(new_content)

print(f"\nOK: Appended {len(scenarios)} scenarios to {YAML_FILE}")
print(f"\nRun tests with:")
print(f"  cd backend && ./venv/bin/pytest tests/reconciliation/ -v")