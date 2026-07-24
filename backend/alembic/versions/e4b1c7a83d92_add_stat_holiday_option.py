"""add stat_holiday_option to payroll_settings

Revision ID: e4b1c7a83d92
Revises: d3a9f2e1c4b8
Create Date: 2026-07-22

Alberta ESA general holidays give employer two options when employee works on a
regular workday holiday:
  1 = pay 1.5x for hours worked + average daily wage
  2 = pay regular rate + provide a future day off with average daily wage
Default is 1 (simpler, no day-in-lieu tracking needed).
"""
from alembic import op
import sqlalchemy as sa

revision = 'e4b1c7a83d92'
down_revision = 'd3a9f2e1c4b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'payroll_settings',
        sa.Column(
            'stat_holiday_option',
            sa.SmallInteger(),
            nullable=False,
            server_default=sa.text('1'),
        ),
    )


def downgrade() -> None:
    op.drop_column('payroll_settings', 'stat_holiday_option')