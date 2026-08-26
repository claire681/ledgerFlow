"""add bank_accounts table

Revision ID: e45111cd299a
Revises: f7a2b9d4e1c8
Create Date: 2026-08-26 05:09:16.567052

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'e45111cd299a'
down_revision: Union[str, None] = 'f7a2b9d4e1c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'bank_accounts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False, server_default='chequing'),
        sa.Column('institution', sa.String(), nullable=False),
        sa.Column('last_4', sa.String(length=4), nullable=True),
        sa.Column('opening_balance', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('current_balance', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_bank_accounts_user_id', 'bank_accounts', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_bank_accounts_user_id', table_name='bank_accounts')
    op.drop_table('bank_accounts')
