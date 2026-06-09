"""payroll_engine_tables

Revision ID: 5efc0c9af524
Revises: e476f4614966
Create Date: phase 2 payroll engine foundation

Adds tables for multi-country payroll engine.
Does NOT touch employees or payroll_settings.

Changes:
- CREATE pay_stubs (table never existed; model was orphaned)
- ALTER pay_runs (employer contributions, remittance, finalized/voided)
- CREATE ytd_balances (per employee per year per jurisdiction)
- CREATE tax_tables (brackets and rates per country and year)
- CREATE payroll_audit_log (compliance trail)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision: str = '5efc0c9af524'
down_revision: Union[str, None] = 'e476f4614966'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================
    # 1. CREATE pay_stubs
    # ============================================================
    op.create_table(
        'pay_stubs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('pay_run_id', UUID(as_uuid=True),
                  sa.ForeignKey('pay_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('employee_id', UUID(as_uuid=True),
                  sa.ForeignKey('employees.id'), nullable=False),

        # Snapshot
        sa.Column('employee_name', sa.String(200), nullable=True),
        sa.Column('employee_email', sa.String(255), nullable=True),
        sa.Column('position_title', sa.String(200), nullable=True),

        # Hour breakdown
        sa.Column('hours_regular', sa.Numeric(8, 2), nullable=False, server_default='0'),
        sa.Column('hours_overtime', sa.Numeric(8, 2), nullable=False, server_default='0'),
        sa.Column('hours_stat_holiday', sa.Numeric(8, 2), nullable=False, server_default='0'),
        sa.Column('hours_vacation', sa.Numeric(8, 2), nullable=False, server_default='0'),
        sa.Column('hours_sick', sa.Numeric(8, 2), nullable=False, server_default='0'),
        sa.Column('hours_evening', sa.Numeric(8, 2), nullable=False, server_default='0'),
        sa.Column('hours_overnight', sa.Numeric(8, 2), nullable=False, server_default='0'),
        sa.Column('hours_weekend', sa.Numeric(8, 2), nullable=False, server_default='0'),
        sa.Column('hours_on_call', sa.Numeric(8, 2), nullable=False, server_default='0'),
        sa.Column('hours_travel', sa.Numeric(8, 2), nullable=False, server_default='0'),

        # Pay basis
        sa.Column('pay_type', sa.String(20), nullable=True),
        sa.Column('hourly_rate', sa.Numeric(10, 2), nullable=True),
        sa.Column('salary_amount', sa.Numeric(10, 2), nullable=False, server_default='0'),

        # Earnings
        sa.Column('gross_pay', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('bonus', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('commission', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('reimbursement', sa.Numeric(10, 2), nullable=False, server_default='0'),

        # Employee deductions (country-agnostic naming)
        sa.Column('federal_tax', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('provincial_or_state_tax', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('local_tax', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('social_security_employee', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('social_security_2_employee', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('unemployment_employee', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('other_employee_deductions', JSONB(), nullable=True),
        sa.Column('total_employee_deductions', sa.Numeric(12, 2), nullable=False, server_default='0'),

        # Employer contributions
        sa.Column('social_security_employer', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('unemployment_employer', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('workers_comp_employer', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('other_employer_contributions', JSONB(), nullable=True),
        sa.Column('total_employer_contributions', sa.Numeric(12, 2), nullable=False, server_default='0'),

        # Net
        sa.Column('net_pay', sa.Numeric(12, 2), nullable=False, server_default='0'),

        # Audit + artifacts
        sa.Column('calculation_snapshot', JSONB(), nullable=True),
        sa.Column('paystub_pdf_s3_key', sa.String(500), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('currency', sa.String(3), nullable=False, server_default='CAD'),

        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_pay_stubs_pay_run_id', 'pay_stubs', ['pay_run_id'])
    op.create_index('ix_pay_stubs_employee_id', 'pay_stubs', ['employee_id'])

    # ============================================================
    # 2. ALTER pay_runs
    # ============================================================
    op.add_column('pay_runs', sa.Column('total_employer_contributions',
                  sa.Numeric(14, 2), nullable=False, server_default='0'))
    op.add_column('pay_runs', sa.Column('total_remittance_owed',
                  sa.Numeric(14, 2), nullable=False, server_default='0'))
    op.add_column('pay_runs', sa.Column('finalized_at',
                  sa.DateTime(timezone=True), nullable=True))
    op.add_column('pay_runs', sa.Column('finalized_by_user_id',
                  UUID(as_uuid=True), nullable=True))
    op.add_column('pay_runs', sa.Column('voided_at',
                  sa.DateTime(timezone=True), nullable=True))
    op.add_column('pay_runs', sa.Column('void_reason',
                  sa.Text(), nullable=True))

    # ============================================================
    # 3. CREATE ytd_balances
    # ============================================================
    op.create_table(
        'ytd_balances',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('employee_id', UUID(as_uuid=True),
                  sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tax_year', sa.Integer(), nullable=False),
        sa.Column('jurisdiction', sa.String(20), nullable=False),

        sa.Column('ytd_gross', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('ytd_federal_tax', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('ytd_provincial_or_state_tax', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('ytd_social_security_employee', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('ytd_social_security_employer', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('ytd_unemployment_employee', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('ytd_unemployment_employer', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('ytd_pensionable_earnings', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('ytd_insurable_earnings', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('ytd_other_deductions', JSONB(), nullable=True),

        sa.Column('last_pay_run_id', UUID(as_uuid=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),

        sa.UniqueConstraint('employee_id', 'tax_year', 'jurisdiction',
                            name='uq_ytd_employee_year_jurisdiction'),
    )
    op.create_index('ix_ytd_balances_employee_id', 'ytd_balances', ['employee_id'])
    op.create_index('ix_ytd_balances_tax_year', 'ytd_balances', ['tax_year'])

    # ============================================================
    # 4. CREATE tax_tables
    # ============================================================
    op.create_table(
        'tax_tables',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('country', sa.String(2), nullable=False),
        sa.Column('subnational', sa.String(20), nullable=True),
        sa.Column('tax_year', sa.Integer(), nullable=False),
        sa.Column('table_type', sa.String(50), nullable=False),
        sa.Column('effective_from', sa.Date(), nullable=False),
        sa.Column('effective_to', sa.Date(), nullable=True),
        sa.Column('data', JSONB(), nullable=False),
        sa.Column('source_url', sa.String(500), nullable=True),
        sa.Column('source_document_hash', sa.String(128), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_by_user_id', UUID(as_uuid=True), nullable=True),
    )
    op.create_index('ix_tax_tables_country_year_type', 'tax_tables',
                    ['country', 'tax_year', 'table_type'])

    # ============================================================
    # 5. CREATE payroll_audit_log
    # ============================================================
    op.create_table(
        'payroll_audit_log',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('actor_user_id', UUID(as_uuid=True), nullable=True),
        sa.Column('actor_role', sa.String(50), nullable=True),
        sa.Column('before_state', JSONB(), nullable=True),
        sa.Column('after_state', JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('ai_session_id', UUID(as_uuid=True), nullable=True),
        sa.Column('ai_was_overridden', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_payroll_audit_owner_entity', 'payroll_audit_log',
                    ['owner_id', 'entity_type', 'entity_id'])
    op.create_index('ix_payroll_audit_created_at', 'payroll_audit_log', ['created_at'])


def downgrade() -> None:
    op.drop_table('payroll_audit_log')
    op.drop_table('tax_tables')
    op.drop_table('ytd_balances')
    op.drop_column('pay_runs', 'void_reason')
    op.drop_column('pay_runs', 'voided_at')
    op.drop_column('pay_runs', 'finalized_by_user_id')
    op.drop_column('pay_runs', 'finalized_at')
    op.drop_column('pay_runs', 'total_remittance_owed')
    op.drop_column('pay_runs', 'total_employer_contributions')
    op.drop_table('pay_stubs')
