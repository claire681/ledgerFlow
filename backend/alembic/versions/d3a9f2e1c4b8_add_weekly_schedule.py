"""add weekly_schedule to employees

Revision ID: d3a9f2e1c4b8
Revises: c2f8d3e1a5b7
Create Date: 2026-07-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'd3a9f2e1c4b8'
down_revision = 'c2f8d3e1a5b7'
branch_labels = None
depends_on = None


# jsonb_build_object avoids colons in the SQL entirely
_DEFAULT_SQL = (
    "jsonb_build_object("
    "'mon', true, 'tue', true, 'wed', true, 'thu', true, "
    "'fri', true, 'sat', true, 'sun', true)"
)


def upgrade() -> None:
    op.add_column(
        'employees',
        sa.Column(
            'weekly_schedule',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    op.execute(
        f"UPDATE employees SET weekly_schedule = {_DEFAULT_SQL} "
        "WHERE weekly_schedule IS NULL"
    )
    op.alter_column(
        'employees',
        'weekly_schedule',
        nullable=False,
        server_default=sa.text(_DEFAULT_SQL),
    )


def downgrade() -> None:
    op.drop_column('employees', 'weekly_schedule')