"""add memo column to pay_stubs

Revision ID: 548c24efbd76
Revises: 
Create Date: 2026-07-06

"""
from alembic import op
import sqlalchemy as sa


revision = '548c24efbd76'
down_revision = '71b170de0d00'
branch_labels = None
depends_on = None


def upgrade():
    # Add nullable memo column to pay_stubs
    op.add_column('pay_stubs', sa.Column('memo', sa.String(length=500), nullable=True))


def downgrade():
    op.drop_column('pay_stubs', 'memo')
