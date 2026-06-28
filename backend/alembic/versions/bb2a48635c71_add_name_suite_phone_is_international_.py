"""add name suite phone is_international to work_locations

Revision ID: bb2a48635c71
Revises: 9c1e78d375e2
Create Date: 2026-06-28 05:30:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'bb2a48635c71'
down_revision: Union[str, None] = '9c1e78d375e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add name, suite, phone, is_international columns to support full Work Locations UI."""
    op.execute("ALTER TABLE work_locations ADD COLUMN IF NOT EXISTS name VARCHAR(200)")
    op.execute("ALTER TABLE work_locations ADD COLUMN IF NOT EXISTS suite VARCHAR(100)")
    op.execute("ALTER TABLE work_locations ADD COLUMN IF NOT EXISTS phone VARCHAR(50)")
    op.execute("ALTER TABLE work_locations ADD COLUMN IF NOT EXISTS is_international BOOLEAN DEFAULT FALSE")


def downgrade() -> None:
    op.execute("ALTER TABLE work_locations DROP COLUMN IF EXISTS name")
    op.execute("ALTER TABLE work_locations DROP COLUMN IF EXISTS suite")
    op.execute("ALTER TABLE work_locations DROP COLUMN IF EXISTS phone")
    op.execute("ALTER TABLE work_locations DROP COLUMN IF EXISTS is_international")
