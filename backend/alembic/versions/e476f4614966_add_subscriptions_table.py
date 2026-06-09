"""add subscriptions table

Revision ID: e476f4614966
Revises: 
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'e476f4614966'
down_revision = '0716ec1e1d49'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'subscriptions',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('paypal_subscription_id', sa.String(), nullable=True),
        sa.Column('paypal_plan_id', sa.String(), nullable=False),
        sa.Column('plan_slug', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='APPROVAL_PENDING'),
        sa.Column('approval_url', sa.String(2048), nullable=True),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_payment_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('paypal_subscription_id'),
    )
    op.create_index('ix_subscriptions_user_id', 'subscriptions', ['user_id'])
    op.create_index('ix_subscriptions_paypal_subscription_id', 'subscriptions', ['paypal_subscription_id'])
    op.create_index('ix_subscriptions_status', 'subscriptions', ['status'])


def downgrade():
    op.drop_index('ix_subscriptions_status', table_name='subscriptions')
    op.drop_index('ix_subscriptions_paypal_subscription_id', table_name='subscriptions')
    op.drop_index('ix_subscriptions_user_id', table_name='subscriptions')
    op.drop_table('subscriptions')
