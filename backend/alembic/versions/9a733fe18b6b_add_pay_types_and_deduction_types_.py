"""Add pay_types and deduction_types tables clean

Revision ID: 9a733fe18b6b
Revises: bb2a48635c71
Create Date: 2026-06-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '9a733fe18b6b'
down_revision: Union[str, None] = 'bb2a48635c71'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create pay_types table
    op.create_table('pay_types',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=False, server_default='CA'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('calc_method', sa.String(), nullable=False, server_default='fixed'),
        sa.Column('default_rate', sa.Numeric(precision=12, scale=4), nullable=True),
        sa.Column('unit_label', sa.String(), nullable=True),
        sa.Column('federal_taxable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('cpp_contributable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('ei_insurable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('vacationable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('wcb_reportable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('t4_box', sa.String(), nullable=True, server_default='14'),
        sa.Column('country_flags', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pay_types_owner_id', 'pay_types', ['owner_id'], unique=False)
    op.create_index('ix_pay_types_is_default', 'pay_types', ['is_default'], unique=False)

    # Create deduction_types table
    op.create_table('deduction_types',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=False, server_default='CA'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('calc_method', sa.String(), nullable=False, server_default='fixed'),
        sa.Column('default_amount', sa.Numeric(precision=12, scale=4), nullable=True),
        sa.Column('unit_label', sa.String(), nullable=True),
        sa.Column('is_pre_tax', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('employer_matched', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('country_flags', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_deduction_types_owner_id', 'deduction_types', ['owner_id'], unique=False)
    op.create_index('ix_deduction_types_is_default', 'deduction_types', ['is_default'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_deduction_types_is_default', table_name='deduction_types')
    op.drop_index('ix_deduction_types_owner_id', table_name='deduction_types')
    op.drop_table('deduction_types')
    op.drop_index('ix_pay_types_is_default', table_name='pay_types')
    op.drop_index('ix_pay_types_owner_id', table_name='pay_types')
    op.drop_table('pay_types')
