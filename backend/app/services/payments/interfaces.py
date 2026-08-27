"""
Provider interfaces for payment orchestration.

Two abstract interfaces:
- PaymentProvider   -- for outbound employee/vendor payments (direct deposit, EFT)
- RemittanceProvider -- for tax/regulatory remittances (CRA, WCB, GST, etc.)

Concrete adapters implement one or both. The service layer holds no
provider-specific logic; swapping providers is swapping which adapter
is registered in the container.

Status contract (all providers return one of these):
    pending          -- accepted by service, not yet handed to provider
    processing       -- provider accepted, working on it
    in_transit       -- funds/data has left, not yet confirmed at destination
    settled          -- fully complete, confirmed at destination
    failed           -- provider or destination rejected
    cancelled        -- user or system cancelled before settlement
    needs_action     -- provider needs something from the user (KYB, retry, etc.)

Manual/legacy payments carry status="recorded" until they're reconciled.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Optional
from uuid import UUID


# ---------------------------------------------------------------------------
# Status enum (single source of truth)
# ---------------------------------------------------------------------------

class PaymentStatus(str, Enum):
    RECORDED     = "recorded"       # legacy manual, pre-provider
    PENDING      = "pending"        # accepted, not yet at provider
    PROCESSING   = "processing"     # provider working on it
    IN_TRANSIT   = "in_transit"     # sent, awaiting confirmation
    SETTLED      = "settled"        # complete
    FAILED       = "failed"         # rejected
    CANCELLED    = "cancelled"      # aborted before settlement
    NEEDS_ACTION = "needs_action"   # user must do something
    VOIDED       = "voided"         # explicitly voided after recording


TERMINAL_STATUSES = {
    PaymentStatus.SETTLED,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
    PaymentStatus.VOIDED,
}


# ---------------------------------------------------------------------------
# Result objects (what adapters return to the service layer)
# ---------------------------------------------------------------------------

@dataclass
class PaymentResult:
    """Returned by PaymentProvider methods.
    Contains the raw provider status + our normalised PaymentStatus."""
    status: PaymentStatus
    provider_status: Optional[str] = None            # raw string from provider
    provider_transaction_id: Optional[str] = None
    provider_fee: Optional[Decimal] = None
    provider_metadata: dict[str, Any] = field(default_factory=dict)
    failure_reason: Optional[str] = None
    needs_action_reason: Optional[str] = None
    settled_at: Optional[datetime] = None


@dataclass
class RecipientAccount:
    """Employee/vendor bank account to receive funds."""
    name: str                      # payee full name
    institution_number: Optional[str] = None   # 3-digit CA bank code
    transit_number: Optional[str] = None       # 5-digit branch
    account_number: Optional[str] = None       # bank account number
    email: Optional[str] = None                # for e-Transfer providers


@dataclass
class SourceAccount:
    """The employer/business account funds come from."""
    bank_account_id: UUID          # our internal id
    display_name: str


@dataclass
class PayoutRequest:
    """One employee/vendor payment instruction."""
    payment_id: UUID
    recipient: RecipientAccount
    amount: Decimal
    memo: Optional[str] = None
    reference: Optional[str] = None   # e.g. pay period, invoice number


@dataclass
class RemittanceRequest:
    """One tax/regulatory remittance instruction."""
    payment_id: UUID
    authority: str                    # "cra_source_deductions" | "wcb_alberta" | "gst_hst" | ...
    account_reference: str            # e.g. CRA payroll account "746043769RP0001"
    amount: Decimal
    period: str                       # e.g. "2026-08"
    memo: Optional[str] = None


# ---------------------------------------------------------------------------
# PaymentProvider interface
# ---------------------------------------------------------------------------

class PaymentProvider(ABC):
    """Abstract adapter for outbound employee/vendor payments (direct deposit, EFT)."""

    # Provider identifier stored in payments.provider column
    name: str

    @abstractmethod
    async def send_payout(
        self,
        request: PayoutRequest,
        source: SourceAccount,
    ) -> PaymentResult:
        """Initiate a single payout. Return current status."""
        raise NotImplementedError

    @abstractmethod
    async def get_status(self, provider_transaction_id: str) -> PaymentResult:
        """Poll the provider for latest status of a payout."""
        raise NotImplementedError

    async def cancel(self, provider_transaction_id: str) -> PaymentResult:
        """Attempt to cancel a payout. Default: not supported."""
        raise NotImplementedError(f"{self.name} does not support cancellation")

    async def handle_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> Optional[PaymentResult]:
        """Handle an inbound webhook from the provider.
        Return a PaymentResult if this webhook maps to a payment status change,
        None if it's an unrelated event. Default: no webhook support."""
        return None


# ---------------------------------------------------------------------------
# RemittanceProvider interface
# ---------------------------------------------------------------------------

class RemittanceProvider(ABC):
    """Abstract adapter for tax/regulatory remittances (CRA, WCB, GST, etc.)."""

    name: str

    @abstractmethod
    async def send_remittance(
        self,
        request: RemittanceRequest,
        source: SourceAccount,
    ) -> PaymentResult:
        """Submit a remittance. Return current status."""
        raise NotImplementedError

    @abstractmethod
    async def get_status(self, provider_transaction_id: str) -> PaymentResult:
        """Poll the provider for latest status."""
        raise NotImplementedError

    async def cancel(self, provider_transaction_id: str) -> PaymentResult:
        raise NotImplementedError(f"{self.name} does not support cancellation")

    async def handle_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> Optional[PaymentResult]:
        return None
