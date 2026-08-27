"""
Generic webhook receiver for payment providers.

Endpoint:
    POST /api/v1/webhooks/{provider}

The provider name in the URL identifies which adapter should handle the payload.
The adapter is responsible for:
    1. Parsing the payload
    2. Verifying signature (using headers)
    3. Returning a PaymentResult if the event maps to a status change,
       or None if the event is not relevant (heartbeat, unrelated event, etc.)

If a PaymentResult is returned, we look up the matching Payment (by provider +
provider_transaction_id) and update it via process_webhook_result.

No auth on this endpoint - provider identity is proven by signature verification
inside the adapter. Return 200 for both processed and ignored events so the
provider does not retry unnecessarily. Return 400/500 only for genuine errors.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Payment
from app.services.payments import (
    get_payment_provider,
    get_remittance_provider,
    process_webhook_result,
)


router = APIRouter(tags=["webhooks"])


@router.post("/webhooks/{provider}", status_code=200)
async def receive_webhook(
    provider: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Receive a webhook from a payment provider and update the corresponding payment.

    Returns:
        {"status": "processed", "payment_id": "...", "new_status": "..."}   -- payment updated
        {"status": "ignored", "reason": "..."}                              -- webhook not applicable
    """
    # Parse payload
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    headers = dict(request.headers)

    # Try to hand it to a payment adapter first, then a remittance adapter.
    # (Same provider name may be registered as both.)
    result = None
    for lookup in (get_payment_provider, get_remittance_provider):
        try:
            adapter = lookup(provider)
        except ValueError:
            continue
        try:
            candidate = await adapter.handle_webhook(payload, headers)
        except Exception as exc:
            # Adapter blew up parsing - log and return 400 so provider can inspect
            raise HTTPException(status_code=400, detail=f"Adapter {provider} failed to parse webhook: {exc}")
        if candidate is not None:
            result = candidate
            break

    if result is None:
        return {"status": "ignored", "reason": "webhook did not map to a payment status change"}

    if not result.provider_transaction_id:
        return {"status": "ignored", "reason": "no provider_transaction_id in webhook"}

    # Look up the Payment by provider + provider_transaction_id
    stmt = select(Payment).where(
        Payment.provider == provider,
        Payment.provider_transaction_id == result.provider_transaction_id,
    )
    payment = (await db.execute(stmt)).scalar_one_or_none()
    if payment is None:
        return {"status": "ignored", "reason": "no matching payment"}

    updated = await process_webhook_result(db, payment, result, provider)
    return {
        "status": "processed",
        "payment_id": str(updated.id),
        "new_status": updated.status,
    }
