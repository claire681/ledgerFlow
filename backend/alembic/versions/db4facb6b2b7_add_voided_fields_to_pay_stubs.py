"""add voided fields to pay_stubs

Revision ID: db4facb6b2b7
Revises: 548c24efbd76
Create Date: 2026-07-08

"""
from alembic import op
import sqlalchemy as sa


revision = 'db4facb6b2b7'
down_revision = '548c24efbd76'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('pay_stubs', sa.Column('voided', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('pay_stubs', sa.Column('voided_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('pay_stubs', sa.Column('voided_reason', sa.String(length=1000), nullable=True))


def downgrade():
    op.drop_column('pay_stubs', 'voided_reason')
    op.drop_column('pay_stubs', 'voided_at')
    op.drop_column('pay_stubs', 'voided')
