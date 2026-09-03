"""Payment provider system for Novala.

Public API:
    from app.providers import get_provider, PaymentRequest, PaymentResponse

Usage:
    provider = get_provider(country="CA")
    result = await provider.send_payment(PaymentRequest(...))

Auto-registers all providers on import.
"""
from app.providers.base import PaymentProvider, PaymentRequest, PaymentResponse
from app.providers.router import get_provider, list_providers, register_provider
from app.providers.implementations.manual import ManualProvider
from app.providers.implementations.vopay import VoPayProvider

# Auto-register on import
register_provider(VoPayProvider())
register_provider(ManualProvider())

__all__ = [
    "PaymentProvider",
    "PaymentRequest",
    "PaymentResponse",
    "get_provider",
    "list_providers",
]
