"""add pay_schedule_config jsonb to payroll_settings

Revision ID: 6cf0c532055e
Revises: a2c238f5bafb
Create Date: 2026-06-28 01:25:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '6cf0c532055e'
down_revision: Union[str, None] = 'a2c238f5bafb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add pay_schedule_config JSONB for per-frequency schedule details (e.g. semi-monthly two days, weekly weekday)."""
    op.execute("ALTER TABLE payroll_settings ADD COLUMN IF NOT EXISTS pay_schedule_config JSONB DEFAULT '{}'::jsonb")


def downgrade() -> None:
    op.execute("ALTER TABLE payroll_settings DROP COLUMN IF EXISTS pay_schedule_config")
