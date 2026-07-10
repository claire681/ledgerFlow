"""add payroll_taxes_scaffolding

Revision ID: a5bf912acd64
Revises: e70695966cc1
Create Date: 2026-07-10

Adds three schema pieces for the Payroll Taxes area:
1. remitter_type column on company_profiles
   Country-agnostic string column. For CA: monthly, quarterly, threshold_1, threshold_2, annual
   For US: monthly, semiweekly, next_day
   Default 'monthly' since that's the base pattern in most countries.

2. archived_forms table (country-agnostic)
   Stores generated tax forms across all countries. country + form_type identify
   what kind of form. form_data JSONB holds the full snapshot of numbers so we
   can regenerate the PDF anytime.

3. audit_events table (universal)
   Logs any significant business event: paycheque voids, adjustments, form
   archives, settings changes, etc. Not tied to any country.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "a5bf912acd64"
down_revision = "e70695966cc1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ============================================================
    # 1) remitter_type on company_profiles
    # ============================================================
    op.add_column(
        "company_profiles",
        sa.Column(
            "remitter_type",
            sa.String(30),
            nullable=False,
            server_default="monthly",
        ),
    )

    # ============================================================
    # 2) archived_forms table
    # ============================================================
    op.create_table(
        "archived_forms",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("country", sa.String(2), nullable=False, index=True),
        sa.Column("form_type", sa.String(20), nullable=False, index=True),
        sa.Column("form_subtype", sa.String(50), nullable=True),
        sa.Column("period_start", sa.Date, nullable=False),
        sa.Column("period_end", sa.Date, nullable=False),
        sa.Column("period_label", sa.String(100), nullable=True),
        sa.Column("form_data", postgresql.JSONB, nullable=False),
        sa.Column("pdf_s3_key", sa.String(500), nullable=True),
        sa.Column(
            "archived_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "archived_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_archived_forms_user_period",
        "archived_forms",
        ["user_id", "period_end"],
    )

    # ============================================================
    # 3) audit_events table
    # ============================================================
    op.create_table(
        "audit_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("event_type", sa.String(50), nullable=False, index=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "actor_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("action", sa.String(20), nullable=False),
        sa.Column("details", postgresql.JSONB, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
            index=True,
        ),
    )
    op.create_index(
        "ix_audit_events_user_created",
        "audit_events",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_audit_events_user_created", table_name="audit_events")
    op.drop_table("audit_events")

    op.drop_index("ix_archived_forms_user_period", table_name="archived_forms")
    op.drop_table("archived_forms")

    op.drop_column("company_profiles", "remitter_type")
