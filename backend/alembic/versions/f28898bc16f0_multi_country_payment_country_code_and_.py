"""multi-country: payment country_code and currency

Revision ID: f28898bc16f0
Revises: 6051ad9052ff
Create Date: 2026-08-27 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'f28898bc16f0'
down_revision: Union[str, None] = '6051ad9052ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add ISO 3166-1 alpha-2 country code. server_default backfills existing rows to 'CA'.
    op.add_column(
        'payments',
        sa.Column('country_code', sa.String(length=2), nullable=False, server_default='CA'),
    )

    # Add ISO 4217 currency code. server_default backfills existing rows to 'CAD'.
    op.add_column(
        'payments',
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='CAD'),
    )


def downgrade() -> None:
    op.drop_column('payments', 'currency')
    op.drop_column('payments', 'country_code')
