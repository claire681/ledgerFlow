"""add employee_pay_items and employee_deduction_items tables

Revision ID: 71b170de0d00
Revises: 9a733fe18b6b
Create Date: 2026-06-29 06:08:24.830775729

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid


# revision identifiers, used by Alembic.
revision = '71b170de0d00'
down_revision = '9a733fe18b6b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # employee_pay_items: links an employee to a pay type with optional rate override
    op.create_table(
        'employee_pay_items',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('employee_id', UUID(as_uuid=True), sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('pay_type_id', UUID(as_uuid=True), sa.ForeignKey('pay_types.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('owner_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('rate_override', sa.Numeric(12, 4), nullable=True),
        sa.Column('unit_label_override', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('paused_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_employee_pay_items_employee_active', 'employee_pay_items', ['employee_id', 'is_active'])

    # employee_deduction_items: links an employee to a deduction type with optional amount override
    op.create_table(
        'employee_deduction_items',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('employee_id', UUID(as_uuid=True), sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('deduction_type_id', UUID(as_uuid=True), sa.ForeignKey('deduction_types.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('owner_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('amount_override', sa.Numeric(12, 4), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('paused_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_employee_deduction_items_employee_active', 'employee_deduction_items', ['employee_id', 'is_active'])


def downgrade() -> None:
    op.drop_index('ix_employee_deduction_items_employee_active', table_name='employee_deduction_items')
    op.drop_table('employee_deduction_items')
    op.drop_index('ix_employee_pay_items_employee_active', table_name='employee_pay_items')
    op.drop_table('employee_pay_items')
