"""Add pay_schedules table and FKs on employees + pay_runs

Revision ID: c2f8d3e1a5b7
Revises: a5bf912acd64
Create Date: 2026-07-19 23:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c2f8d3e1a5b7"
down_revision = "a5bf912acd64"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pay_schedules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("frequency", sa.String(20), nullable=False),
        sa.Column("pay_day_of_week", sa.Integer(), nullable=True),
        sa.Column("pay_day_1", sa.Integer(), nullable=True),
        sa.Column("pay_day_2", sa.Integer(), nullable=True),
        sa.Column("first_pay_date", sa.Date(), nullable=False),
        sa.Column("first_period_end", sa.Date(), nullable=False),
        sa.Column("first_period_start", sa.Date(), nullable=False),
        sa.Column("holiday_shift", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("weekend_shift", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("auto_run_enabled", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("auto_run_days_before", sa.Integer(), server_default="2", nullable=False),
        sa.Column("is_default", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_paused", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("color", sa.String(20), server_default="#15A08C", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_pay_schedules_owner_id", "pay_schedules", ["owner_id"])
    op.create_index("ix_pay_schedules_is_default", "pay_schedules", ["owner_id", "is_default"])

    op.add_column("employees",
                  sa.Column("pay_schedule_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key("fk_employees_pay_schedule", "employees", "pay_schedules",
                          ["pay_schedule_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_employees_pay_schedule_id", "employees", ["pay_schedule_id"])

    op.add_column("pay_runs",
                  sa.Column("pay_schedule_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key("fk_pay_runs_pay_schedule", "pay_runs", "pay_schedules",
                          ["pay_schedule_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_pay_runs_pay_schedule_id", "pay_runs", ["pay_schedule_id"])


def downgrade() -> None:
    op.drop_index("ix_pay_runs_pay_schedule_id", "pay_runs")
    op.drop_constraint("fk_pay_runs_pay_schedule", "pay_runs", type_="foreignkey")
    op.drop_column("pay_runs", "pay_schedule_id")

    op.drop_index("ix_employees_pay_schedule_id", "employees")
    op.drop_constraint("fk_employees_pay_schedule", "employees", type_="foreignkey")
    op.drop_column("employees", "pay_schedule_id")

    op.drop_index("ix_pay_schedules_is_default", "pay_schedules")
    op.drop_index("ix_pay_schedules_owner_id", "pay_schedules")
    op.drop_table("pay_schedules")