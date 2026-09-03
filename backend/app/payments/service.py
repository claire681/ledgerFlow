"""Payment service - creates obligations, attempts payment, tracks results.

Public API:
    from app.payments.service import create_obligation, attempt_payment

Usage:
    obligation = await create_obligation(...)
    attempt = await attempt_payment(obligation, provider_name="vopay")

Idempotency: attempting same obligation multiple times is safe.
Returns existing successful attempt if one exists.
"""
import uuid
import hashlib
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import PaymentObligation, PaymentAttempt
from app.providers import get_provider, PaymentRequest


def _generate_idempotency_key(obligation_id: uuid.UUID, attempt_number: int) -> str:
    """Deterministic key: same obligation + attempt = same key.

    This lets us safely retry: if network died mid-request, retrying with
    same key means provider knows it's the same attempt (not a new one).
    """
    raw = f"novala-obligation-{obligation_id}-attempt-{attempt_number}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


async def create_obligation(
    db: AsyncSession,
    amount: Decimal,
    currency: str,
    from_account_id: str,
    to_account_id: str,
    description: Optional[str] = None,
    pay_stub_id: Optional[uuid.UUID] = None,
    customer_id: Optional[uuid.UUID] = None,
    obligation_type: str = "payroll",
    metadata: Optional[dict] = None,
) -> PaymentObligation:
    """Record that we owe this money. Immutable - never edit after creation."""
    obligation = PaymentObligation(
        id=uuid.uuid4(),
        pay_stub_id=pay_stub_id,
        customer_id=customer_id,
        amount=amount,
        currency=currency,
        from_account_id=from_account_id,
        to_account_id=to_account_id,
        description=description,
        obligation_type=obligation_type,
        metadata_json=metadata or {},
    )
    db.add(obligation)
    await db.flush()
    return obligation


async def attempt_payment(
    db: AsyncSession,
    obligation: PaymentObligation,
    provider_name: str = "manual",
    country: str = "CA",
) -> PaymentAttempt:
    """Attempt to pay an obligation. Safe to call multiple times.

    Returns existing successful attempt if one exists.
    Otherwise creates new attempt, calls provider, records result.
    """
    # 1. Check if already succeeded (return existing attempt)
    existing_stmt = select(PaymentAttempt).where(
        PaymentAttempt.obligation_id == obligation.id,
        PaymentAttempt.status == "succeeded",
    )
    existing_result = await db.execute(existing_stmt)
    existing = existing_result.scalar_one_or_none()
    if existing:
        return existing

    # 2. Count previous attempts to generate unique idempotency key
    count_stmt = select(PaymentAttempt).where(PaymentAttempt.obligation_id == obligation.id)
    all_attempts = (await db.execute(count_stmt)).scalars().all()
    attempt_number = len(all_attempts) + 1
    idempotency_key = _generate_idempotency_key(obligation.id, attempt_number)

    # 3. Create attempt record (pending)
    attempt = PaymentAttempt(
        id=uuid.uuid4(),
        obligation_id=obligation.id,
        provider_name=provider_name,
        idempotency_key=idempotency_key,
        status="pending",
    )
    db.add(attempt)
    await db.flush()

    # 4. Call the provider
    try:
        provider = get_provider(country=country, provider_name=provider_name)
        request = PaymentRequest(
            from_account_id=obligation.from_account_id,
            to_account_id=obligation.to_account_id,
            amount=obligation.amount,
            currency=obligation.currency,
            description=obligation.description or f"Payment for obligation {obligation.id}",
            idempotency_key=idempotency_key,
            metadata={"obligation_id": str(obligation.id)},
        )
        response = await provider.send_payment(request)

        # 5. Update attempt with result
        attempt.provider_transaction_id = response.provider_transaction_id
        attempt.status = response.status if response.success else "failed"
        attempt.error_code = response.error_code
        attempt.error_message = response.error_message
        attempt.raw_response = response.raw_response
        if response.status in ("succeeded", "completed"):
            attempt.completed_at = datetime.now(timezone.utc)

    except Exception as e:
        attempt.status = "failed"
        attempt.error_message = str(e)

    await db.flush()
    return attempt
