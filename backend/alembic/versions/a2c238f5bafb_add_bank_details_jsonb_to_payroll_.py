"""add bank_details jsonb to payroll_settings

Revision ID: a2c238f5bafb
Revises: ee6989dae41a
Create Date: 2026-06-27 21:34:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2c238f5bafb'
down_revision: Union[str, None] = 'ee6989dae41a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add bank_details JSONB column to payroll_settings for country-specific bank info."""
    op.execute("ALTER TABLE payroll_settings ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb")


def downgrade() -> None:
    """Remove bank_details column."""
    op.execute("ALTER TABLE payroll_settings DROP COLUMN IF EXISTS bank_details")
