#!/usr/bin/env python3
"""Check a migration file for dangerous patterns.

Only checks upgrade() function - downgrade() is allowed to reverse anything.

Usage:
    python alembic/check_migration_safety.py alembic/versions/YOUR_MIGRATION.py

Exit codes:
    0 = safe (all checks pass)
    1 = dangerous patterns found (review needed)
"""
import sys
import re
from pathlib import Path


DANGEROUS_PATTERNS = [
    (r"\bop\.drop_table\b",           "DROP TABLE - permanent data loss risk"),
    (r"\bop\.drop_column\b",          "DROP COLUMN - breaks any running code that uses it"),
    (r"\bop\.alter_column.*type_=",   "TYPE CHANGE - existing data may not fit new type"),
    (r"\bop\.drop_index\b",           "DROP INDEX - queries may become slow"),
    (r"\bop\.drop_constraint\b",      "DROP CONSTRAINT - referential integrity risk"),
    (r"nullable=False.*server_default=None", "NOT NULL without default - existing rows will fail"),
]

WARN_PATTERNS = [
    (r"\bop\.execute\(",              "Raw SQL - ensure it's reviewed carefully"),
]


def extract_function_body(content: str, func_name: str) -> str:
    """Extract the body of a specific function from Python code."""
    pattern = rf"def {func_name}\(\).*?(?=\ndef |\Z)"
    match = re.search(pattern, content, re.DOTALL)
    return match.group(0) if match else ""


def check_file(path: Path) -> int:
    if not path.exists():
        print(f"ERROR: file not found: {path}")
        return 1

    content = path.read_text()

    # Only check upgrade() body - downgrade() is expected to reverse things
    upgrade_body = extract_function_body(content, "upgrade")
    downgrade_body = extract_function_body(content, "downgrade")

    issues = []
    warnings = []

    for pattern, message in DANGEROUS_PATTERNS:
        if re.search(pattern, upgrade_body):
            issues.append(f"  DANGER (in upgrade): {message}")

    for pattern, message in WARN_PATTERNS:
        if re.search(pattern, upgrade_body):
            warnings.append(f"  WARN (in upgrade): {message}")

    # Check downgrade() actually does something
    if downgrade_body and "pass" in downgrade_body and "op." not in downgrade_body:
        issues.append("  DANGER: downgrade() is empty - migration cannot be rolled back")

    print(f"\nChecking: {path.name}")
    print("=" * 60)

    if issues:
        print("\nDANGEROUS PATTERNS FOUND:")
        for issue in issues:
            print(issue)

    if warnings:
        print("\nWARNINGS:")
        for warning in warnings:
            print(warning)

    if not issues and not warnings:
        print("\nSAFE - no dangerous patterns detected in upgrade()")
        return 0

    if issues:
        print("\nSee docs/DB_MIGRATIONS.md for safe patterns")
        return 1

    return 0  # Only warnings, not blocking


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_migration_safety.py alembic/versions/YOUR_MIGRATION.py")
        sys.exit(2)
    sys.exit(check_file(Path(sys.argv[1])))
