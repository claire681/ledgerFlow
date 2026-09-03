"""Abstract base for payment providers.

Every provider (VoPay, Stripe, GoCardless, etc.) implements this interface.
Router picks the right one based on country/customer.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Optional


@dataclass
class PaymentRequest:
    """Standardized payment request across all providers."""
    from_account_id: str        # employer's bank account ID in provider's system
    to_account_id: str          # employee's bank account ID
    amount: Decimal
    currency: str               # ISO 4217 e.g. "CAD", "USD"
    description: str            # e.g. "Payroll 2026-01-15"
    idempotency_key: str        # prevents duplicate charges on retry
    metadata: dict[str, Any]    # custom fields for reconciliation


@dataclass
class PaymentResponse:
    """Standardized payment response."""
    success: bool
    provider_transaction_id: Optional[str]  # provider's internal ID
    status: str                             # pending | completed | failed
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    raw_response: Optional[dict] = None     # for debugging


class PaymentProvider(ABC):
    """Every payment provider must implement this interface."""

    name: str = ""                   # short id: "vopay", "stripe", "manual"
    display_name: str = ""           # human name: "VoPay", "Stripe", "Manual Recording"
    supported_countries: list[str] = []  # ISO codes: ["CA"], ["US"], etc.

    @abstractmethod
    async def send_payment(self, request: PaymentRequest) -> PaymentResponse:
        """Send one payment. Must be idempotent (safe to retry with same idempotency_key)."""
        raise NotImplementedError

    @abstractmethod
    async def get_payment_status(self, provider_transaction_id: str) -> PaymentResponse:
        """Check status of a previously-sent payment."""
        raise NotImplementedError
