"""Layer A: Sanity Bounds Checker.

Validates payroll results against hardcoded reasonable bounds.
Catches egregious errors like:
- CPP contribution exceeding annual max
- Federal tax higher than gross pay
- Negative deductions
- EI contribution exceeding annual max
"""
import time
from decimal import Decimal
from typing import Any

from app.reconciliation.base import BaseChecker, CheckerResult, Mismatch


# Hardcoded bounds for 2026. Update yearly.
BOUNDS_2026 = {
    "CA": {
        "max_cpp_annual": Decimal("4230.45"),
        "max_cpp2_annual": Decimal("416.00"),
        "max_ei_annual": Decimal("1123.07"),
        "max_federal_tax_rate": Decimal("0.33"),
        "max_provincial_tax_rate": Decimal("0.21"),
    },
}


class SanityChecker(BaseChecker):
    layer = "A"
    name = "sanity_bounds"
    description = "Validates against hardcoded reasonable bounds per country"

    async def check(
        self,
        engine_result: dict[str, Any],
        input_data: dict[str, Any],
    ) -> CheckerResult:
        start = time.perf_counter()
        mismatches: list[Mismatch] = []

        try:
            country = input_data.get("country", "CA")
            bounds = BOUNDS_2026.get(country)

            if bounds is None:
                # Unknown country - can't validate, log info only
                duration_ms = (time.perf_counter() - start) * 1000
                return self._make_result(duration_ms=duration_ms)

            gross_pay = Decimal(str(engine_result.get("gross_pay", 0)))

            # Check 1: All contributions must be non-negative
            for field in ["federal_tax", "provincial_tax", "cpp", "cpp2", "ei"]:
                val = Decimal(str(engine_result.get(field, 0)))
                if val < 0:
                    mismatches.append(Mismatch(
                        field_name=field,
                        expected_value=Decimal("0"),
                        actual_value=val,
                        diff_cents=int(val * 100),
                        severity="critical",
                        reason=f"{field} cannot be negative",
                    ))

            # Check 2: Federal tax rate cannot exceed max bracket
            fed_tax = Decimal(str(engine_result.get("federal_tax", 0)))
            if gross_pay > 0:
                effective_rate = fed_tax / gross_pay
                if effective_rate > bounds["max_federal_tax_rate"]:
                    max_allowed = gross_pay * bounds["max_federal_tax_rate"]
                    mismatches.append(Mismatch(
                        field_name="federal_tax",
                        expected_value=max_allowed,
                        actual_value=fed_tax,
                        diff_cents=int((fed_tax - max_allowed) * 100),
                        severity="critical",
                        reason=f"Federal tax rate {effective_rate:.2%} exceeds max bracket {bounds['max_federal_tax_rate']:.0%}",
                    ))

            # Check 3: Provincial tax rate cannot exceed max
            prov_tax = Decimal(str(engine_result.get("provincial_tax", 0)))
            if gross_pay > 0:
                effective_rate = prov_tax / gross_pay
                if effective_rate > bounds["max_provincial_tax_rate"]:
                    max_allowed = gross_pay * bounds["max_provincial_tax_rate"]
                    mismatches.append(Mismatch(
                        field_name="provincial_tax",
                        expected_value=max_allowed,
                        actual_value=prov_tax,
                        diff_cents=int((prov_tax - max_allowed) * 100),
                        severity="critical",
                        reason=f"Provincial tax rate {effective_rate:.2%} exceeds max {bounds['max_provincial_tax_rate']:.0%}",
                    ))

            # Check 4: CPP contribution + YTD cannot exceed annual max
            cpp = Decimal(str(engine_result.get("cpp", 0)))
            ytd_cpp = Decimal(str(input_data.get("ytd_cpp_paid", 0)))
            if ytd_cpp + cpp > bounds["max_cpp_annual"]:
                max_allowed = max(bounds["max_cpp_annual"] - ytd_cpp, Decimal("0"))
                mismatches.append(Mismatch(
                    field_name="cpp",
                    expected_value=max_allowed,
                    actual_value=cpp,
                    diff_cents=int((cpp - max_allowed) * 100),
                    severity="critical",
                    reason=f"CPP total ${ytd_cpp + cpp} exceeds annual max ${bounds['max_cpp_annual']}",
                ))

            # Check 5: EI contribution + YTD cannot exceed annual max
            ei = Decimal(str(engine_result.get("ei", 0)))
            ytd_ei = Decimal(str(input_data.get("ytd_ei_paid", 0)))
            if ytd_ei + ei > bounds["max_ei_annual"]:
                max_allowed = max(bounds["max_ei_annual"] - ytd_ei, Decimal("0"))
                mismatches.append(Mismatch(
                    field_name="ei",
                    expected_value=max_allowed,
                    actual_value=ei,
                    diff_cents=int((ei - max_allowed) * 100),
                    severity="critical",
                    reason=f"EI total ${ytd_ei + ei} exceeds annual max ${bounds['max_ei_annual']}",
                ))

            # Check 6: Net pay cannot be negative or exceed gross
            net_pay = Decimal(str(engine_result.get("net_pay", 0)))
            if net_pay < 0:
                mismatches.append(Mismatch(
                    field_name="net_pay",
                    expected_value=Decimal("0"),
                    actual_value=net_pay,
                    diff_cents=int(net_pay * 100),
                    severity="critical",
                    reason="Net pay cannot be negative",
                ))
            if net_pay > gross_pay:
                mismatches.append(Mismatch(
                    field_name="net_pay",
                    expected_value=gross_pay,
                    actual_value=net_pay,
                    diff_cents=int((net_pay - gross_pay) * 100),
                    severity="critical",
                    reason="Net pay cannot exceed gross pay",
                ))

            duration_ms = (time.perf_counter() - start) * 1000
            return self._make_result(mismatches=mismatches, duration_ms=duration_ms)

        except Exception as e:
            duration_ms = (time.perf_counter() - start) * 1000
            return self._make_result(duration_ms=duration_ms, error=str(e))
