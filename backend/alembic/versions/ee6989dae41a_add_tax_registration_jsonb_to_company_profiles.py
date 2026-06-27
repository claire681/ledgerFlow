"""add tax_registration jsonb to company_profiles

Revision ID: ee6989dae41a
Revises: 5efc0c9af524
Create Date: 2026-06-27 08:05:17.777069
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ee6989dae41a'
down_revision: Union[str, None] = '5efc0c9af524'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add tax_registration JSONB column to company_profiles."""
    op.execute("ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS tax_registration JSONB DEFAULT '{}'::jsonb")


def downgrade() -> None:
    """Remove tax_registration column."""
    op.execute("ALTER TABLE company_profiles DROP COLUMN IF EXISTS tax_registration")
