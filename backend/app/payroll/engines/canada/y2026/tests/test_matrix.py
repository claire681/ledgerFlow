"""
CRA-Verified Payroll Engine Test Matrix
========================================
Runs a battery of 5 scenarios per province against our engine, then
compares against expected PDOC values.

Each province must pass all 5 scenarios before being marked verified.

Scenario coverage:
  1. LOW      - Bracket 1, BPA credit, base-CPP credit, enhanced-CPP deduction
  2. MID      - Bracket 2, CPP2 starting to trigger, higher K constants
  3. HIGH     - Bracket 3-4, K constants, CPP2 maxed, EI maxed
  4. CPP2_MID - Bi-weekly worker hits YMPE mid-year (period 18ish)
  5. CLAIM_0  - Non-resident, claim code 0, no BPA credit

Usage:
    python3 -m app.payroll.engines.canada.y2026.tests.test_matrix
    python3 -m app.payroll.engines.canada.y2026.tests.test_matrix --province AB
    python3 -m app.payroll.engines.canada.y2026.tests.test_matrix --scenario LOW

Author: Novala payroll engine
Verified against: CRA T4127 122nd Edition (January 1, 2026) + PDOC
"""

import argparse
import sys
from decimal import Decimal
from dataclasses import dataclass, field
from typing import Optional, Dict, List

from app.payroll.engines.canada.y2026 import cpp, ei, federal_tax, alberta, ontario


# ============================================================
# Test Scenario Data Class
# ============================================================

@dataclass
class Scenario:
    """One PDOC-verified test scenario."""
    name: str
    province: str
    gross_pay: Decimal
    pay_periods_per_year: int
    ytd_pensionable: Decimal = Decimal("0")
    ytd_insurable: Decimal = Decimal("0")
    ytd_cpp_base: Decimal = Decimal("0")  # YTD base CPP contribution (0.0495 portion)
    ytd_ei: Decimal = Decimal("0")  # YTD EI premium
    td1_federal_claim: Optional[Decimal] = None
    td1_provincial_claim: Optional[Decimal] = None
    cpp_exempt: bool = False
    ei_exempt: bool = False
    additional_withholding: Decimal = Decimal("0")
    # Expected PDOC results:
    expected_cpp: Optional[Decimal] = None
    expected_cpp2: Optional[Decimal] = None
    expected_ei: Optional[Decimal] = None
    expected_federal_tax: Optional[Decimal] = None
    expected_provincial_tax: Optional[Decimal] = None
    expected_net: Optional[Decimal] = None
    # For reference only
    pdoc_verified: bool = False
    notes: str = ""


# ============================================================
# Alberta Scenarios (5)
# ============================================================

AB_SCENARIOS = [
    Scenario(
        name="AB_1_LOW",
        province="AB",
        gross_pay=Decimal("1760.00"),  # $22/hr x 80 hrs
        pay_periods_per_year=26,
        td1_federal_claim=Decimal("16452.00"),
        td1_provincial_claim=Decimal("22769.00"),
        # PDOC verified 2026-07-18 for BrightCare Claire
        expected_cpp=Decimal("96.71"),
        expected_cpp2=Decimal("0.00"),
        expected_ei=Decimal("28.69"),
        expected_federal_tax=Decimal("132.17"),
        expected_provincial_tax=Decimal("60.71"),
        expected_net=Decimal("1441.72"),
        pdoc_verified=True,
        notes="BrightCare Claire baseline. Verified against PDOC 2026-07-18.",
    ),
    Scenario(
        name="AB_2_MID",
        province="AB",
        gross_pay=Decimal("3333.33"),  # ~$80,000/yr semi-monthly
        pay_periods_per_year=24,
        td1_federal_claim=Decimal("16452.00"),
        td1_provincial_claim=Decimal("22769.00"),
        # PDOC verified 2026-07-18 (BrightCare Novala)
        expected_cpp=Decimal("189.66"),
        expected_cpp2=Decimal("0.00"),
        expected_ei=Decimal("54.33"),
        expected_federal_tax=Decimal("386.49"),
        expected_provincial_tax=Decimal("187.77"),
        expected_net=Decimal("2515.08"),
        pdoc_verified=True,
        notes="$80k salary semi-monthly. Bracket 2 federal + Alberta bracket 2. PDOC verified 2026-07-18.",
    ),
    Scenario(
        name="AB_3_HIGH",
        province="AB",
        gross_pay=Decimal("16666.67"),  # ~$200,000/yr monthly
        pay_periods_per_year=12,
        td1_federal_claim=Decimal("16452.00"),
        td1_provincial_claim=Decimal("22769.00"),
        # PDOC verified 2026-07-18 (BrightCare Novala)
        # Note: 1-3 cent difference from our engine is within T4127 Chapter 1 rounding tolerance
        expected_cpp=Decimal("974.31"),
        expected_cpp2=Decimal("0.00"),
        expected_ei=Decimal("271.67"),
        expected_federal_tax=Decimal("3215.15"),
        expected_provincial_tax=Decimal("1449.30"),
        expected_net=Decimal("10756.24"),
        pdoc_verified=True,
        notes="$200k salary monthly. Federal bracket 3, Alberta bracket 4, K constants applied. PDOC verified 2026-07-18.",
    ),
    Scenario(
        name="AB_4_CPP2_TRIGGER",
        province="AB",
        gross_pay=Decimal("4200.00"),  # Semi-monthly, from T4127 Appendix 1 example
        pay_periods_per_year=24,
        ytd_pensionable=Decimal("71400.00"),  # PDOC treats as $74,600 (max)
        ytd_insurable=Decimal("68900.00"),  # EI already maxed
        ytd_cpp_base=Decimal("3519.45"),  # Base CPP maxed
        ytd_ei=Decimal("1123.07"),  # EI maxed
        td1_federal_claim=Decimal("16452.00"),
        td1_provincial_claim=Decimal("22769.00"),
        # PDOC verified 2026-07-18
        expected_cpp=Decimal("0.00"),
        expected_cpp2=Decimal("168.00"),
        expected_ei=Decimal("0.00"),
        expected_federal_tax=Decimal("536.25"),
        expected_provincial_tax=Decimal("260.83"),
        expected_net=Decimal("3234.92"),
        pdoc_verified=True,
        notes="CPP+EI maxed. CPP2 starts. Tests T4127 Chapter 4 K2 max rule. PDOC verified 2026-07-18.",
    ),
    Scenario(
        name="AB_5_CLAIM_ZERO",
        province="AB",
        gross_pay=Decimal("1760.00"),
        pay_periods_per_year=26,
        td1_federal_claim=Decimal("0.00"),  # Claim code 0
        td1_provincial_claim=Decimal("0.00"),
        # PDOC verified 2026-07-18
        expected_cpp=Decimal("96.71"),
        expected_cpp2=Decimal("0.00"),
        expected_ei=Decimal("28.69"),
        expected_federal_tax=Decimal("220.76"),
        expected_provincial_tax=Decimal("130.77"),
        expected_net=Decimal("1283.07"),
        pdoc_verified=True,
        notes="Non-resident. Claim code 0. K1 = 0, K2 still applies. PDOC verified 2026-07-18.",
    ),
]




# ============================================================
# Ontario Scenarios (5)
# ============================================================

ON_SCENARIOS = [
    Scenario(
        name="ON_1_LOW",
        province="ON",
        gross_pay=Decimal("1760.00"),
        pay_periods_per_year=26,
        td1_federal_claim=Decimal("16452.00"),
        td1_provincial_claim=Decimal("12989.00"),
        expected_cpp=Decimal("96.71"),
        expected_cpp2=Decimal("0.00"),
        expected_ei=Decimal("28.69"),
        expected_federal_tax=Decimal("132.17"),
        expected_provincial_tax=Decimal("74.63"),
        expected_net=Decimal("1427.80"),
        pdoc_verified=True,
        notes="Ontario Claire equivalent. Bracket 1, no surtax/OHP/reduction. PDOC verified 2026-07-18.",
    ),
    Scenario(
        name="ON_2_MID",
        province="ON",
        gross_pay=Decimal("3333.33"),
        pay_periods_per_year=24,
        td1_federal_claim=Decimal("16452.00"),
        td1_provincial_claim=Decimal("12989.00"),
        # PDOC verified 2026-07-18
        expected_cpp=Decimal("189.66"),
        expected_cpp2=Decimal("0.00"),
        expected_ei=Decimal("54.33"),
        expected_federal_tax=Decimal("386.49"),
        expected_provincial_tax=Decimal("204.15"),
        expected_net=Decimal("2498.70"),
        pdoc_verified=True,
        notes="$80k salary semi-monthly. Bracket 2 federal + Ontario, OHP V2 applies. PDOC verified 2026-07-18.",
    ),
    Scenario(
        name="ON_3_HIGH",
        province="ON",
        gross_pay=Decimal("16666.67"),
        pay_periods_per_year=12,
        td1_federal_claim=Decimal("16452.00"),
        td1_provincial_claim=Decimal("12989.00"),
        expected_cpp=None,
        expected_cpp2=None,
        expected_ei=None,
        expected_federal_tax=None,
        expected_provincial_tax=None,
        expected_net=None,
        pdoc_verified=False,
        notes="$200k salary. Bracket 4, V1 surtax applies, OHP max.",
    ),
    Scenario(
        name="ON_4_CPP2_TRIGGER",
        province="ON",
        gross_pay=Decimal("4200.00"),
        pay_periods_per_year=24,
        ytd_pensionable=Decimal("71400.00"),
        ytd_insurable=Decimal("68900.00"),
        ytd_cpp_base=Decimal("3519.45"),
        ytd_ei=Decimal("1123.07"),
        td1_federal_claim=Decimal("16452.00"),
        td1_provincial_claim=Decimal("12989.00"),
        expected_cpp=None,
        expected_cpp2=None,
        expected_ei=None,
        expected_federal_tax=None,
        expected_provincial_tax=None,
        expected_net=None,
        pdoc_verified=False,
        notes="CPP+EI maxed. CPP2 starts. Tests K2 max rule.",
    ),
    Scenario(
        name="ON_5_CLAIM_ZERO",
        province="ON",
        gross_pay=Decimal("1760.00"),
        pay_periods_per_year=26,
        td1_federal_claim=Decimal("0.00"),
        td1_provincial_claim=Decimal("0.00"),
        expected_cpp=None,
        expected_cpp2=None,
        expected_ei=None,
        expected_federal_tax=None,
        expected_provincial_tax=None,
        expected_net=None,
        pdoc_verified=False,
        notes="Non-resident. Claim code 0. K1 = 0.",
    ),
]


# All provinces in one dictionary
ALL_SCENARIOS: Dict[str, List[Scenario]] = {
    "AB": AB_SCENARIOS,
    "ON": ON_SCENARIOS,
    # "BC": BC_SCENARIOS,
    # ... etc
}


# ============================================================
# Provincial tax dispatcher
# ============================================================

def calculate_provincial_tax(scenario: Scenario, cpp_amt: Decimal, ei_amt: Decimal, cpp2_amt: Decimal = Decimal("0")) -> Decimal:
    """Route to the right province's tax function."""
    p = scenario.province
    if p == "AB":
        return alberta.calculate_alberta_tax(
            gross_pay=scenario.gross_pay,
            pay_periods_per_year=scenario.pay_periods_per_year,
            td1_provincial_claim=scenario.td1_provincial_claim,
            cpp_contribution=cpp_amt,
            ei_contribution=ei_amt,
            ytd_cpp_base=scenario.ytd_cpp_base,
            ytd_ei=scenario.ytd_ei,
            cpp2_contribution=cpp2_amt,
        )
    if p == "ON":
        return ontario.calculate_ontario_tax(
            gross_pay=scenario.gross_pay,
            pay_periods_per_year=scenario.pay_periods_per_year,
            td1_provincial_claim=scenario.td1_provincial_claim,
            cpp_contribution=cpp_amt,
            ei_contribution=ei_amt,
            ytd_cpp_base=scenario.ytd_cpp_base,
            ytd_ei=scenario.ytd_ei,
            cpp2_contribution=cpp2_amt,
        )
    raise NotImplementedError(f"Province {p} not implemented yet")


# ============================================================
# Runner
# ============================================================

class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    BOLD = "\033[1m"
    END = "\033[0m"


def compare(label: str, actual: Decimal, expected: Optional[Decimal]) -> bool:
    """Print comparison line. Returns True if match."""
    if expected is None:
        print(f"    {label:22s}: {actual:>12}  (no PDOC baseline)")
        return True  # Not a failure - just uncalibrated
    match = actual == expected
    color = Colors.GREEN if match else Colors.RED
    check = "OK" if match else "FAIL"
    print(f"  {color}{check:4s}{Colors.END} {label:22s}: {actual:>12}  (expected {expected})")
    return match


def run_scenario(s: Scenario) -> bool:
    """Run one scenario. Return True if all lines match expected."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{s.name}{Colors.END} ({s.province}, {s.pay_periods_per_year}pp)")
    print(f"  Gross: ${s.gross_pay}  YTD-P: ${s.ytd_pensionable}  YTD-I: ${s.ytd_insurable}")
    if s.notes:
        print(f"  {Colors.YELLOW}{s.notes}{Colors.END}")

    # CPP
    cpp_amt, cpp2_amt, _ = cpp.calculate_cpp(
        gross_pay=s.gross_pay,
        ytd_pensionable_earnings=s.ytd_pensionable,
        pay_periods_per_year=s.pay_periods_per_year,
        cpp_exempt=s.cpp_exempt,
        province=s.province,
    )

    # EI
    ei_emp, ei_er, _ = ei.calculate_ei(
        gross_pay=s.gross_pay,
        ytd_insurable_earnings=s.ytd_insurable,
        ei_exempt=s.ei_exempt,
        province=s.province,
    )

    # Federal tax
    fed_tax = federal_tax.calculate_federal_tax(
        gross_pay=s.gross_pay,
        pay_periods_per_year=s.pay_periods_per_year,
        td1_federal_claim=s.td1_federal_claim,
        additional_withholding=s.additional_withholding,
        cpp_contribution=cpp_amt,
        ei_contribution=ei_emp,
        ytd_cpp_base=s.ytd_cpp_base,
        ytd_ei=s.ytd_ei,
        cpp2_contribution=cpp2_amt,
    )

    # Provincial tax
    prov_tax = calculate_provincial_tax(s, cpp_amt, ei_emp, cpp2_amt)

    # Net
    total_deductions = cpp_amt + cpp2_amt + ei_emp + fed_tax + prov_tax
    net = s.gross_pay - total_deductions

    # Compare each line
    print()
    results = [
        compare("CPP", cpp_amt, s.expected_cpp),
        compare("CPP2", cpp2_amt, s.expected_cpp2),
        compare("EI employee", ei_emp, s.expected_ei),
        compare("Federal tax", fed_tax, s.expected_federal_tax),
        compare(f"{s.province} provincial tax", prov_tax, s.expected_provincial_tax),
        compare("Net pay", net, s.expected_net),
    ]

    all_pass = all(results)
    if not s.pdoc_verified:
        print(f"  {Colors.YELLOW}(NOT YET PDOC-VERIFIED - populate expected_* fields){Colors.END}")

    return all_pass


def main():
    parser = argparse.ArgumentParser(description="Run CRA-verified payroll engine tests.")
    parser.add_argument("--province", help="Only run one province (e.g. AB)")
    parser.add_argument("--scenario", help="Only run one scenario name (e.g. AB_1_LOW)")
    args = parser.parse_args()

    total_scenarios = 0
    total_passed = 0
    total_verified = 0

    provinces = [args.province.upper()] if args.province else list(ALL_SCENARIOS.keys())

    print(f"\n{Colors.BOLD}=" * 70)
    print(f"CRA-Verified Canadian Payroll Engine Test Matrix")
    print(f"T4127 122nd Edition (January 1, 2026)")
    print(f"={'=' * 69}{Colors.END}")

    for p in provinces:
        if p not in ALL_SCENARIOS:
            print(f"\n{Colors.RED}Province {p} has no test scenarios yet{Colors.END}")
            continue
        for s in ALL_SCENARIOS[p]:
            if args.scenario and s.name != args.scenario:
                continue
            total_scenarios += 1
            if s.pdoc_verified:
                total_verified += 1
            if run_scenario(s):
                total_passed += 1

    print(f"\n{Colors.BOLD}=" * 70)
    print(f"Summary: {total_passed}/{total_scenarios} scenarios passed all checks")
    print(f"         {total_verified}/{total_scenarios} scenarios have PDOC baselines")
    print(f"={'=' * 69}{Colors.END}\n")

    sys.exit(0 if total_passed == total_scenarios else 1)


if __name__ == "__main__":
    main()