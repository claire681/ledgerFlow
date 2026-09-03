#!/usr/bin/env python3
"""Scan Novala codebase for hardcoded country/currency/locale values.

Usage:
    python3 tools/country_currency_audit.py

Generates a report categorizing findings by severity:
- HIGH: hardcoded in function defaults, business logic
- MEDIUM: hardcoded in tests, examples
- LOW: hardcoded in comments, docstrings
"""
import re
import os
from pathlib import Path
from collections import defaultdict


# Patterns to search for
PATTERNS = {
    "country_ca": (r'\b["\']CA["\']', "Hardcoded country code 'CA'"),
    "country_canada": (r'\b["\']Canada["\']', "Hardcoded country name 'Canada'"),
    "currency_cad": (r'\b["\']CAD["\']', "Hardcoded currency 'CAD'"),
    "currency_usd": (r'\b["\']USD["\']', "Hardcoded currency 'USD'"),
    "timezone_edmonton": (r'["\']America/Edmonton["\']', "Hardcoded timezone Edmonton"),
    "timezone_toronto": (r'["\']America/Toronto["\']', "Hardcoded timezone Toronto"),
    "default_country_param": (r'country\s*[:=]\s*["\']CA["\']', "Default country=CA in signature"),
    "default_currency_param": (r'currency\s*[:=]\s*["\']CAD["\']', "Default currency=CAD in signature"),
    "phone_canada_format": (r'\+1\s*\(?\d{3}\)?', "Canadian phone number format"),
    "postal_code_canada": (r'[A-Z]\d[A-Z]\s*\d[A-Z]\d', "Canadian postal code pattern"),
}


# Directories to scan
SCAN_DIRS = ["backend/app", "frontend/src"]

# Extensions to include
INCLUDE_EXTS = {".py", ".ts", ".tsx", ".js", ".jsx"}

# Paths to skip
SKIP_PATTERNS = ["node_modules", "__pycache__", ".git", "dist", "build", "venv", ".pytest_cache", "cra-official-data"]


def should_skip(path):
    return any(skip in str(path) for skip in SKIP_PATTERNS)


def scan_file(path):
    """Return list of (line_number, pattern_name, description, line_content) found."""
    findings = []
    try:
        content = path.read_text(errors='ignore')
    except Exception:
        return findings

    for lineno, line in enumerate(content.split('\n'), start=1):
        for pattern_name, (regex, desc) in PATTERNS.items():
            if re.search(regex, line):
                findings.append((lineno, pattern_name, desc, line.strip()))
    return findings


def classify_severity(pattern_name, path):
    """Return HIGH/MEDIUM/LOW."""
    path_str = str(path).lower()
    if "test" in path_str or "spec" in path_str:
        return "MEDIUM"
    if pattern_name.startswith("default_"):
        return "HIGH"
    if "engine" in path_str or "service" in path_str or "calculator" in path_str:
        return "HIGH"
    if pattern_name in ("country_ca", "currency_cad", "timezone_edmonton"):
        return "HIGH"
    return "MEDIUM"


def main():
    root = Path(".")
    findings_by_severity = {"HIGH": [], "MEDIUM": [], "LOW": []}
    files_scanned = 0

    for scan_dir in SCAN_DIRS:
        scan_path = root / scan_dir
        if not scan_path.exists():
            continue
        for path in scan_path.rglob("*"):
            if path.is_dir() or should_skip(path):
                continue
            if path.suffix not in INCLUDE_EXTS:
                continue

            files_scanned += 1
            for lineno, pattern_name, desc, line in scan_file(path):
                severity = classify_severity(pattern_name, path)
                findings_by_severity[severity].append({
                    "file": str(path),
                    "line": lineno,
                    "pattern": pattern_name,
                    "description": desc,
                    "content": line[:120],  # truncate long lines
                })

    # Report
    print(f"\n{'='*70}")
    print(f"COUNTRY/CURRENCY AUDIT — Novala Codebase")
    print(f"{'='*70}")
    print(f"Files scanned: {files_scanned}")
    print(f"HIGH severity:   {len(findings_by_severity['HIGH'])}")
    print(f"MEDIUM severity: {len(findings_by_severity['MEDIUM'])}")
    print(f"LOW severity:    {len(findings_by_severity['LOW'])}")

    for severity in ["HIGH", "MEDIUM", "LOW"]:
        findings = findings_by_severity[severity]
        if not findings:
            continue
        print(f"\n{'='*70}")
        print(f"{severity} SEVERITY ({len(findings)} findings)")
        print(f"{'='*70}")

        # Group by pattern for cleaner reading
        by_pattern = defaultdict(list)
        for f in findings:
            by_pattern[f["pattern"]].append(f)

        for pattern, items in sorted(by_pattern.items()):
            print(f"\n[{pattern}] {items[0]['description']} — {len(items)} occurrences")
            # Show first 10
            for item in items[:10]:
                print(f"  {item['file']}:{item['line']}")
                print(f"    → {item['content']}")
            if len(items) > 10:
                print(f"  ... and {len(items) - 10} more")

    print(f"\n{'='*70}\n")


if __name__ == "__main__":
    main()
