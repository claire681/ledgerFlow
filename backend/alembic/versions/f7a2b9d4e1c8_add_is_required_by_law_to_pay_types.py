"""add is_required_by_law column to pay_types

Revision ID: f7a2b9d4e1c8
Revises: e4b1c7a83d92
Create Date: 2026-07-25
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f7a2b9d4e1c8'
down_revision = 'e4b1c7a83d92'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'pay_types',
        sa.Column('is_required_by_law', sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade():
    op.drop_column('pay_types', 'is_required_by_law')