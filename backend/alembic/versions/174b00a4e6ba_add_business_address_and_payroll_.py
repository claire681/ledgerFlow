"""add business address and payroll account fields to company_profiles

Revision ID: 174b00a4e6ba
Revises: a2fd75bafd48
Create Date: 2026-07-09

"""
from alembic import op
import sqlalchemy as sa


revision = '174b00a4e6ba'
down_revision = 'a2fd75bafd48'
branch_labels = None
depends_on = None


def upgrade():
    # CRA Business Number (or equivalent tax ID in other countries)
    op.add_column('company_profiles', sa.Column('business_number', sa.String(length=20), nullable=True))
    
    # CRA Payroll Program Account (e.g. RP0001) or equivalent
    op.add_column('company_profiles', sa.Column('payroll_rp_account', sa.String(length=20), nullable=True))
    
    # Structured address fields (better than one combined address string)
    op.add_column('company_profiles', sa.Column('address_street', sa.String(length=200), nullable=True))
    op.add_column('company_profiles', sa.Column('address_city', sa.String(length=100), nullable=True))
    op.add_column('company_profiles', sa.Column('address_postal_code', sa.String(length=20), nullable=True))


def downgrade():
    op.drop_column('company_profiles', 'address_postal_code')
    op.drop_column('company_profiles', 'address_city')
    op.drop_column('company_profiles', 'address_street')
    op.drop_column('company_profiles', 'payroll_rp_account')
    op.drop_column('company_profiles', 'business_number')
