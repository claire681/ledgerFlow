# Reconciliation Test Framework

**Purpose:** Prove Novala's payroll calculations match every jurisdiction's
official calculator (CRA, IRS, HMRC, ATO, etc.) to the penny.

**The rule:** No jurisdiction goes live to customers until its reconciliation
test suite passes 100%.

## Directory Layout

```
tests/reconciliation/
├── framework/                    # Country-agnostic infrastructure
│   ├── scenario.py               # Generic Scenario dataclass
│   ├── loader.py                 # YAML → Scenario loader
│   ├── runner.py                 # Runs scenarios, compares to expected
│   └── comparators.py            # Decimal comparison helpers
├── canada/
│   ├── scenarios/
│   │   ├── ab_2026.yaml          # Alberta scenarios
│   │   ├── bc_2026.yaml          # (future) BC scenarios
│   │   └── ...
│   └── test_alberta_reconciliation.py
├── usa/                          # (Phase 7)
├── uk/                           # (Phase 7)
└── ...
```

## Adding a Scenario

1. Enter the employee data into the jurisdiction's official calculator.
   - Canada: [CRA PDOC](https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/payroll-deductions-online-calculator.html)
   - US: [IRS tax withholding estimator](https://www.irs.gov/individuals/tax-withholding-estimator)
   - UK: HMRC calculator
   - etc.

2. Record every number the calculator returns.

3. Add an entry to the appropriate YAML file (see existing scenarios for shape).

4. Set `reconciled_date` to today and `reconciled_by` to your name (audit trail).

5. Run: `pytest tests/reconciliation/canada/test_alberta_reconciliation.py -v`

6. If it passes, commit. If it fails, either the scenario data or Novala's
   engine is wrong. Debug and fix.

## Adding a New Jurisdiction (Region within a Country)

1. Add new scenarios in an existing country folder (e.g. `canada/scenarios/bc_2026.yaml`).
2. Ensure that region's tax handler exists in the payroll engine.
3. Create/extend a pytest file for that region (copy-paste an existing one).
4. No changes needed to the framework.

## Adding a New Country

1. Create `tests/reconciliation/<country>/scenarios/<region>_<year>.yaml`.
2. Add an adapter function in `framework/runner.py` (see `_canada_adapter` for the pattern).
3. Register it in `COUNTRY_ADAPTERS`.
4. Create a pytest file (copy Canada's as template).
5. No changes needed to the loader, scenario schema, or comparator.

## Scenario Schema

Every scenario in every country uses the same top-level shape. Country-specific
fields go in the free-form `country_specific:` and `expected:` dicts, so each
country only carries what applies to it.

See `framework/scenario.py` for the dataclass and `canada/scenarios/ab_2026.yaml`
for a working example.

## Design Principles

- **Data, not code.** Scenarios are YAML so accountants and tax specialists can
  contribute without touching Python.
- **Provenance.** Every scenario records what it was reconciled against, when,
  and by whom. Audit trail baked in.
- **Penny-precise.** Default tolerance is 0.00 — exact match required.
- **Framework never grows per country.** Adding a country adds YAML files and
  one adapter function; framework code stays the same.
- **CI-integrated.** Any scenario failure blocks PR merge (once wired to CI).
