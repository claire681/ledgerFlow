"""add work_locations table

Revision ID: 9c1e78d375e2
Revises: 6cf0c532055e
Create Date: 2026-06-28 05:20:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '9c1e78d375e2'
down_revision: Union[str, None] = '6cf0c532055e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create work_locations table for physical workplaces with country-aware fields."""
    op.execute("""
        CREATE TABLE IF NOT EXISTS work_locations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(200) NOT NULL,
            country VARCHAR(2) NOT NULL DEFAULT 'CA',
            country_subdivision VARCHAR(100),
            street VARCHAR(300),
            suite VARCHAR(100),
            city VARCHAR(150),
            postal_code VARCHAR(20),
            phone VARCHAR(50),
            is_primary BOOLEAN DEFAULT FALSE,
            is_international BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_work_locations_owner_id ON work_locations(owner_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_work_locations_primary ON work_locations(owner_id, is_primary) WHERE is_primary = TRUE")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS work_locations CASCADE")
