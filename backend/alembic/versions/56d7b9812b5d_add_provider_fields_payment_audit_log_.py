"""add provider fields, payment audit log, cra_payroll_account

Revision ID: 56d7b9812b5d
Revises: c0851961d154
Create Date: 2026-08-26 22:12:54.731473

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '56d7b9812b5d'
down_revision: Union[str, None] = 'c0851961d154'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- 1. Extend payments table with provider-agnostic fields ---
    op.add_column('payments', sa.Column('provider', sa.String(), nullable=False, server_default='manual'))
    op.add_column('payments', sa.Column('provider_transaction_id', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('provider_status', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('provider_fee', sa.Numeric(precision=15, scale=2), nullable=True))
    op.add_column('payments', sa.Column('provider_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('payments', sa.Column('failure_reason', sa.Text(), nullable=True))
    op.add_column('payments', sa.Column('needs_action_reason', sa.Text(), nullable=True))
    op.add_column('payments', sa.Column('settled_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index('ix_payments_provider', 'payments', ['provider'], unique=False)
    op.create_index('ix_payments_provider_transaction_id', 'payments', ['provider_transaction_id'], unique=False)

    # --- 2. Add cra_payroll_account to users table ---
    op.add_column('users', sa.Column('cra_payroll_account', sa.String(), nullable=True))

    # --- 3. Create payment_audit_log table ---
    op.create_table(
        'payment_audit_log',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('payment_id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('from_status', sa.String(), nullable=True),
        sa.Column('to_status', sa.String(), nullable=True),
        sa.Column('actor_type', sa.String(), nullable=False),
        sa.Column('actor_id', sa.UUID(), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.id']),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_payment_audit_log_payment_id', 'payment_audit_log', ['payment_id'], unique=False)
    op.create_index('ix_payment_audit_log_owner_id', 'payment_audit_log', ['owner_id'], unique=False)
    op.create_index('ix_payment_audit_log_created_at', 'payment_audit_log', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_payment_audit_log_created_at', table_name='payment_audit_log')
    op.drop_index('ix_payment_audit_log_owner_id', table_name='payment_audit_log')
    op.drop_index('ix_payment_audit_log_payment_id', table_name='payment_audit_log')
    op.drop_table('payment_audit_log')
    op.drop_column('users', 'cra_payroll_account')
    op.drop_index('ix_payments_provider_transaction_id', table_name='payments')
    op.drop_index('ix_payments_provider', table_name='payments')
    op.drop_column('payments', 'settled_at')
    op.drop_column('payments', 'needs_action_reason')
    op.drop_column('payments', 'failure_reason')
    op.drop_column('payments', 'provider_metadata')
    op.drop_column('payments', 'provider_fee')
    op.drop_column('payments', 'provider_status')
    op.drop_column('payments', 'provider_transaction_id')
    op.drop_column('payments', 'provider')
