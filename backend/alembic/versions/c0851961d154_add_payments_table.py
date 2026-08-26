"""add payments table

Revision ID: c0851961d154
Revises: e45111cd299a
Create Date: 2026-08-26 06:50:25.852219

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c0851961d154'
down_revision: Union[str, None] = 'e45111cd299a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'payments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('bank_account_id', sa.UUID(), nullable=True),
        sa.Column('source_type', sa.String(), nullable=False),
        sa.Column('source_ref', sa.String(), nullable=True),
        sa.Column('source_name', sa.String(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('cheque_no', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('print_cheque_queue', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('status', sa.String(), nullable=False, server_default='recorded'),
        sa.Column('voided_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('voided_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.ForeignKeyConstraint(['bank_account_id'], ['bank_accounts.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_payments_owner_id', 'payments', ['owner_id'], unique=False)
    op.create_index('ix_payments_bank_account_id', 'payments', ['bank_account_id'], unique=False)
    op.create_index('ix_payments_payment_date', 'payments', ['payment_date'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_payments_payment_date', table_name='payments')
    op.drop_index('ix_payments_bank_account_id', table_name='payments')
    op.drop_index('ix_payments_owner_id', table_name='payments')
    op.drop_table('payments')
