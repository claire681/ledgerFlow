"""add reconciliation_runs + reconciliation_mismatches tables (Phase 1 - Layer 2 monitoring)

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-02

Manually written to add ONLY these two tables.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reconciliation_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pay_stub_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.Column("subnational", sa.String(length=10), nullable=True),
        sa.Column("tax_year", sa.Integer(), nullable=False),
        sa.Column("engine_version", sa.String(length=50), nullable=False),
        sa.Column("gross_pay", sa.Numeric(12, 2), nullable=False),
        sa.Column("passed", sa.Boolean(), nullable=False),
        sa.Column("mismatch_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("total_diff_cents", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("payroll_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column("reference_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column("checked_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_reconciliation_runs_pay_stub_id", "reconciliation_runs", ["pay_stub_id"])
    op.create_index("ix_reconciliation_runs_customer_id", "reconciliation_runs", ["customer_id"])
    op.create_index("ix_reconciliation_runs_country", "reconciliation_runs", ["country"])
    op.create_index("ix_reconciliation_runs_subnational", "reconciliation_runs", ["subnational"])
    op.create_index("ix_reconciliation_runs_tax_year", "reconciliation_runs", ["tax_year"])
    op.create_index("ix_reconciliation_runs_passed", "reconciliation_runs", ["passed"])
    op.create_index("ix_reconciliation_runs_checked_at", "reconciliation_runs", ["checked_at"])

    op.create_table(
        "reconciliation_mismatches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reconciliation_runs.id"), nullable=False),
        sa.Column("field_name", sa.String(length=50), nullable=False),
        sa.Column("expected_value", sa.Numeric(12, 2), nullable=False),
        sa.Column("actual_value", sa.Numeric(12, 2), nullable=False),
        sa.Column("diff_cents", sa.Integer(), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False, server_default=sa.text("'warning'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_reconciliation_mismatches_run_id", "reconciliation_mismatches", ["run_id"])


def downgrade() -> None:
    op.drop_index("ix_reconciliation_mismatches_run_id", table_name="reconciliation_mismatches")
    op.drop_table("reconciliation_mismatches")
    op.drop_index("ix_reconciliation_runs_checked_at", table_name="reconciliation_runs")
    op.drop_index("ix_reconciliation_runs_passed", table_name="reconciliation_runs")
    op.drop_index("ix_reconciliation_runs_tax_year", table_name="reconciliation_runs")
    op.drop_index("ix_reconciliation_runs_subnational", table_name="reconciliation_runs")
    op.drop_index("ix_reconciliation_runs_country", table_name="reconciliation_runs")
    op.drop_index("ix_reconciliation_runs_customer_id", table_name="reconciliation_runs")
    op.drop_index("ix_reconciliation_runs_pay_stub_id", table_name="reconciliation_runs")
    op.drop_table("reconciliation_runs")
