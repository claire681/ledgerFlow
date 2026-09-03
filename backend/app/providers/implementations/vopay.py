"""VoPayProvider - PLACEHOLDER for future VoPay integration.

Real integration comes in Phase 4 after VoPay account setup completes.
Currently raises NotImplementedError to prevent accidental production use.
"""
from app.providers.base import PaymentProvider, PaymentRequest, PaymentResponse


class VoPayProvider(PaymentProvider):
    name = "vopay"
    display_name = "VoPay (Canadian EFT)"
    supported_countries = ["CA"]

    async def send_payment(self, request: PaymentRequest) -> PaymentResponse:
        raise NotImplementedError(
            "VoPay integration not complete yet. "
            "Complete Phase 4 (website + LinkedIn + VoPay account) first."
        )

    async def get_payment_status(self, provider_transaction_id: str) -> PaymentResponse:
        raise NotImplementedError(
            "VoPay integration not complete yet."
        )
