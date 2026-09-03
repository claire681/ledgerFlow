"""ManualProvider - records payment intent to logs, does NOT actually send money.

Useful for:
- Local development (no real bank calls)
- Testing payroll flow before VoPay integration
- Fallback when real provider is down

DO NOT USE IN PRODUCTION for real customers - it just logs, doesn't pay!
"""
import logging
import uuid
from app.providers.base import PaymentProvider, PaymentRequest, PaymentResponse


logger = logging.getLogger("novala.providers.manual")


class ManualProvider(PaymentProvider):
    name = "manual"
    display_name = "Manual Recording (test/fallback)"
    supported_countries = ["CA", "US", "GB", "AU"]  # supports all - it's a fallback

    async def send_payment(self, request: PaymentRequest) -> PaymentResponse:
        # Just log - DO NOT actually send money
        transaction_id = f"manual-{uuid.uuid4()}"
        logger.info(
            "manual_payment_recorded",
            extra={
                "transaction_id": transaction_id,
                "amount": str(request.amount),
                "currency": request.currency,
                "from": request.from_account_id,
                "to": request.to_account_id,
                "description": request.description,
                "idempotency_key": request.idempotency_key,
            },
        )
        return PaymentResponse(
            success=True,
            provider_transaction_id=transaction_id,
            status="pending",
            raw_response={"note": "Manual recording - no actual payment sent"},
        )

    async def get_payment_status(self, provider_transaction_id: str) -> PaymentResponse:
        # Manual provider always says "pending" - human must reconcile
        return PaymentResponse(
            success=True,
            provider_transaction_id=provider_transaction_id,
            status="pending",
            raw_response={"note": "Manual provider - status must be checked manually"},
        )
