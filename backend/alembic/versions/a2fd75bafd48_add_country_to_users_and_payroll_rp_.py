"""add country to users and payroll_rp_account to companies

Revision ID: a2fd75bafd48
Revises: db4facb6b2b7
Create Date: 2026-07-09

"""
from alembic import op
import sqlalchemy as sa


revision = 'a2fd75bafd48'
down_revision = 'db4facb6b2b7'
branch_labels = None
depends_on = None


def upgrade():
    # Users: country code (ISO 3166 2-letter, e.g. 'CA', 'US', 'GB')
    op.add_column('users', sa.Column('country', sa.String(length=2), nullable=True))

    # Companies: CRA Payroll Program Account (RP number, format: 'RP0001')
    op.add_column('companies', sa.Column('payroll_rp_account', sa.String(length=20), nullable=True))


def downgrade():
    op.drop_column('companies', 'payroll_rp_account')
    op.drop_column('users', 'country')
