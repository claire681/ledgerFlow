"""multi-currency: employee ISO fields + payment FX tracking

Revision ID: f28a04eab458
Revises: f28898bc16f0
Create Date: 2026-08-28 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'f28a04eab458'
down_revision: Union[str, None] = 'f28898bc16f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------- Employee: multi-country canonical ISO fields ----------
    op.add_column(
        'employees',
        sa.Column('country_code', sa.String(length=2), nullable=False, server_default='CA'),
    )
    op.add_column(
        'employees',
        sa.Column('region_code', sa.String(length=10), nullable=True),
    )
    op.add_column(
        'employees',
        sa.Column('tax_residency', sa.String(length=2), nullable=False, server_default='CA'),
    )

    # ---------- Payment: FX tracking for cross-currency payments ----------
    op.add_column(
        'payments',
        sa.Column('source_currency', sa.String(length=3), nullable=True),
    )
    op.add_column(
        'payments',
        sa.Column('source_amount', sa.Numeric(15, 2), nullable=True),
    )
    op.add_column(
        'payments',
        sa.Column('fx_rate', sa.Numeric(15, 8), nullable=True),
    )
    op.add_column(
        'payments',
        sa.Column('fx_fee', sa.Numeric(15, 2), nullable=True),
    )
    op.add_column(
        'payments',
        sa.Column('fx_provider', sa.String(), nullable=True),
    )

    # Backfill existing payments: assume same-currency (source = destination, rate = 1.0)
    op.execute(
        """
        UPDATE payments
        SET source_currency = currency,
            source_amount = amount,
            fx_rate = 1.0,
            fx_fee = 0,
            fx_provider = provider
        WHERE source_currency IS NULL
        """
    )


def downgrade() -> None:
    # Payment FX fields
    op.drop_column('payments', 'fx_provider')
    op.drop_column('payments', 'fx_fee')
    op.drop_column('payments', 'fx_rate')
    op.drop_column('payments', 'source_amount')
    op.drop_column('payments', 'source_currency')

    # Employee multi-country fields
    op.drop_column('employees', 'tax_residency')
    op.drop_column('employees', 'region_code')
    op.drop_column('employees', 'country_code')
