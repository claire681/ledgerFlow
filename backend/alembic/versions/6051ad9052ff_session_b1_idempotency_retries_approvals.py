"""session B1: idempotency, retries, approvals

Revision ID: 6051ad9052ff
Revises: 56d7b9812b5d
Create Date: 2026-08-27 02:48:34.548399

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '6051ad9052ff'
down_revision: Union[str, None] = '56d7b9812b5d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- 1. Extend payments table ---
    op.add_column('payments', sa.Column('idempotency_key', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('payments', sa.Column('last_retry_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('payments', sa.Column('parent_payment_id', sa.UUID(), nullable=True))

    op.create_index('ix_payments_idempotency_key', 'payments', ['idempotency_key'], unique=True)
    op.create_index('ix_payments_parent_payment_id', 'payments', ['parent_payment_id'], unique=False)
    op.create_foreign_key(
        'fk_payments_parent_payment_id',
        'payments', 'payments',
        ['parent_payment_id'], ['id'],
    )

    # --- 2. Create payment_approvals table ---
    op.create_table(
        'payment_approvals',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('payment_id', sa.UUID(), nullable=False),
        sa.Column('approver_id', sa.UUID(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.id']),
        sa.ForeignKeyConstraint(['approver_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_payment_approvals_payment_id', 'payment_approvals', ['payment_id'], unique=False)
    op.create_index('ix_payment_approvals_approver_id', 'payment_approvals', ['approver_id'], unique=False)
    op.create_index('ix_payment_approvals_created_at', 'payment_approvals', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_payment_approvals_created_at', table_name='payment_approvals')
    op.drop_index('ix_payment_approvals_approver_id', table_name='payment_approvals')
    op.drop_index('ix_payment_approvals_payment_id', table_name='payment_approvals')
    op.drop_table('payment_approvals')

    op.drop_constraint('fk_payments_parent_payment_id', 'payments', type_='foreignkey')
    op.drop_index('ix_payments_parent_payment_id', table_name='payments')
    op.drop_index('ix_payments_idempotency_key', table_name='payments')
    op.drop_column('payments', 'parent_payment_id')
    op.drop_column('payments', 'last_retry_at')
    op.drop_column('payments', 'retry_count')
    op.drop_column('payments', 'idempotency_key')
