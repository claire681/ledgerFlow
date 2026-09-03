"""add payment_obligations + payment_attempts tables (Phase 1 - prevent duplicate payments)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-03

Manually written to add ONLY these two tables.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payment_obligations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pay_stub_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("from_account_id", sa.String(length=255), nullable=False),
        sa.Column("to_account_id", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("obligation_type", sa.String(length=50), nullable=False, server_default=sa.text("'payroll'")),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_payment_obligations_pay_stub_id", "payment_obligations", ["pay_stub_id"])
    op.create_index("ix_payment_obligations_customer_id", "payment_obligations", ["customer_id"])
    op.create_index("ix_payment_obligations_created_at", "payment_obligations", ["created_at"])

    op.create_table(
        "payment_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("obligation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("payment_obligations.id"), nullable=False),
        sa.Column("provider_name", sa.String(length=50), nullable=False),
        sa.Column("provider_transaction_id", sa.String(length=255), nullable=True),
        sa.Column("idempotency_key", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("error_code", sa.String(length=50), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("raw_response", postgresql.JSONB(), nullable=True),
        sa.Column("attempted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_payment_attempts_obligation_id", "payment_attempts", ["obligation_id"])
    op.create_index("ix_payment_attempts_provider_name", "payment_attempts", ["provider_name"])
    op.create_index("ix_payment_attempts_provider_transaction_id", "payment_attempts", ["provider_transaction_id"])
    op.create_index("ix_payment_attempts_idempotency_key", "payment_attempts", ["idempotency_key"], unique=True)
    op.create_index("ix_payment_attempts_status", "payment_attempts", ["status"])
    op.create_index("ix_payment_attempts_attempted_at", "payment_attempts", ["attempted_at"])


def downgrade() -> None:
    op.drop_index("ix_payment_attempts_attempted_at", table_name="payment_attempts")
    op.drop_index("ix_payment_attempts_status", table_name="payment_attempts")
    op.drop_index("ix_payment_attempts_idempotency_key", table_name="payment_attempts")
    op.drop_index("ix_payment_attempts_provider_transaction_id", table_name="payment_attempts")
    op.drop_index("ix_payment_attempts_provider_name", table_name="payment_attempts")
    op.drop_index("ix_payment_attempts_obligation_id", table_name="payment_attempts")
    op.drop_table("payment_attempts")
    op.drop_index("ix_payment_obligations_created_at", table_name="payment_obligations")
    op.drop_index("ix_payment_obligations_customer_id", table_name="payment_obligations")
    op.drop_index("ix_payment_obligations_pay_stub_id", table_name="payment_obligations")
    op.drop_table("payment_obligations")
