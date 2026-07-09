"""Add adjustment fields to pay_stubs

Revision ID: e70695966cc1
Revises: 174b00a4e6ba
Create Date: 2026-07-09

Adds three fields to pay_stubs to support adjustment/correction cheques:
- is_adjustment: bool marking a stub as an adjustment cheque
- adjustment_of_stub_id: FK to the original pay_stub being corrected
- adjustment_reason: text explanation

The pattern follows QuickBooks and ADP: to correct a paycheque, you create
a new adjustment cheque linked to the original. The original stays intact;
the adjustment is a separate stub with its own tax withholdings and PDF.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e70695966cc1'
down_revision = '174b00a4e6ba'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('pay_stubs',
        sa.Column('is_adjustment', sa.Boolean(), nullable=False, server_default='false')
    )
    op.add_column('pay_stubs',
        sa.Column('adjustment_of_stub_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.add_column('pay_stubs',
        sa.Column('adjustment_reason', sa.Text(), nullable=True)
    )
    op.create_foreign_key(
        'fk_pay_stubs_adjustment_of',
        'pay_stubs',
        'pay_stubs',
        ['adjustment_of_stub_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_index(
        'ix_pay_stubs_adjustment_of_stub_id',
        'pay_stubs',
        ['adjustment_of_stub_id'],
    )


def downgrade() -> None:
    op.drop_index('ix_pay_stubs_adjustment_of_stub_id', table_name='pay_stubs')
    op.drop_constraint('fk_pay_stubs_adjustment_of', 'pay_stubs', type_='foreignkey')
    op.drop_column('pay_stubs', 'adjustment_reason')
    op.drop_column('pay_stubs', 'adjustment_of_stub_id')
    op.drop_column('pay_stubs', 'is_adjustment')
