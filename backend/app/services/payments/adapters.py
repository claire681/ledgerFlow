"""
Manual and Mock adapters for PaymentProvider and RemittanceProvider.

- Manual*   : records the payment as "recorded" and returns instructions
              for the user to complete the actual money movement outside
              Novala. This is the fallback that always works.

- Mock*     : simulates async provider processing so we can test the full
              provider-driven flow (webhooks, status transitions, retries,
              failure modes) without any real money moving. Configurable
              via env vars for testing edge cases.
"""
from __future__ import annotations
import asyncio
import os
import random
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Optional

from .interfaces import (
    PaymentProvider,
    RemittanceProvider,
    PaymentResult,
    PaymentStatus,
    PayoutRequest,
    RemittanceRequest,
    SourceAccount,
)


# ---------------------------------------------------------------------------
# Manual adapters (the always-works fallback)
# ---------------------------------------------------------------------------

class ManualPaymentProvider(PaymentProvider):
    """Records the payment but does not move money. User pays outside Novala."""

    name = "manual"

    async def send_payout(self, request: PayoutRequest, source: SourceAccount) -> PaymentResult:
        return PaymentResult(
            status=PaymentStatus.RECORDED,
            provider_status="manual_pending_user_action",
            provider_transaction_id=None,
            provider_metadata={
                "instruction": "User must send payment outside Novala.",
                "recipient_name": request.recipient.name,
                "amount": str(request.amount),
                "reference": request.reference,
            },
            needs_action_reason="Pay via your bank. Then mark as sent in Novala.",
        )

    async def get_status(self, provider_transaction_id: str) -> PaymentResult:
        # Manual payments don't have a queryable status - user marks them themselves
        return PaymentResult(
            status=PaymentStatus.RECORDED,
            provider_status="manual_no_polling",
        )


class ManualRemittanceProvider(RemittanceProvider):
    """Records the remittance but does not submit it. User remits to CRA themselves."""

    name = "manual"

    async def send_remittance(self, request: RemittanceRequest, source: SourceAccount) -> PaymentResult:
        return PaymentResult(
            status=PaymentStatus.RECORDED,
            provider_status="manual_pending_user_action",
            provider_transaction_id=None,
            provider_metadata={
                "instruction": "Pay CRA via online banking, CRA My Payment, or PAD.",
                "authority": request.authority,
                "account": request.account_reference,
                "amount": str(request.amount),
                "period": request.period,
            },
            needs_action_reason="Send this remittance to CRA. Then mark as sent in Novala.",
        )

    async def get_status(self, provider_transaction_id: str) -> PaymentResult:
        return PaymentResult(
            status=PaymentStatus.RECORDED,
            provider_status="manual_no_polling",
        )


# ---------------------------------------------------------------------------
# Mock adapters (for testing the full auto-pay flow end-to-end)
# ---------------------------------------------------------------------------

def _env_flag(name: str, default: bool = False) -> bool:
    v = os.getenv(name, "").strip().lower()
    if not v:
        return default
    return v in ("1", "true", "yes", "on")


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


class MockPaymentProvider(PaymentProvider):
    """Simulates an async payment provider.

    Env vars for testing edge cases:
        MOCK_FAIL_RATE=0.1        -- 10% of payments fail immediately
        MOCK_NEEDS_ACTION_RATE=0.05  -- 5% require user action (bad account, etc.)
        MOCK_INSTANT_SETTLE=true  -- skip in_transit, go straight to settled
    """

    name = "mock"

    def __init__(self, fail_rate: Optional[float] = None, needs_action_rate: Optional[float] = None):
        self.fail_rate = fail_rate if fail_rate is not None else _env_float("MOCK_FAIL_RATE", 0.0)
        self.needs_action_rate = needs_action_rate if needs_action_rate is not None else _env_float("MOCK_NEEDS_ACTION_RATE", 0.0)
        self.instant_settle = _env_flag("MOCK_INSTANT_SETTLE", False)
        self._states: dict[str, PaymentResult] = {}  # by provider_transaction_id

    async def send_payout(self, request: PayoutRequest, source: SourceAccount) -> PaymentResult:
        # Simulate small validation latency
        await asyncio.sleep(0.05)

        provider_txn_id = f"mock_pay_{uuid.uuid4().hex[:16]}"
        roll = random.random()

        if roll < self.fail_rate:
            result = PaymentResult(
                status=PaymentStatus.FAILED,
                provider_status="mock_rejected",
                provider_transaction_id=provider_txn_id,
                provider_fee=Decimal("0"),
                failure_reason="Mock provider: simulated rejection (insufficient funds at source).",
                provider_metadata={"simulated": True, "reason": "insufficient_funds"},
            )
        elif roll < self.fail_rate + self.needs_action_rate:
            result = PaymentResult(
                status=PaymentStatus.NEEDS_ACTION,
                provider_status="mock_needs_action",
                provider_transaction_id=provider_txn_id,
                needs_action_reason="Mock provider: recipient bank account could not be verified.",
                provider_metadata={"simulated": True, "reason": "invalid_recipient"},
            )
        else:
            status = PaymentStatus.SETTLED if self.instant_settle else PaymentStatus.PROCESSING
            result = PaymentResult(
                status=status,
                provider_status="mock_accepted",
                provider_transaction_id=provider_txn_id,
                provider_fee=Decimal("1.25"),
                settled_at=datetime.now(timezone.utc) if status == PaymentStatus.SETTLED else None,
                provider_metadata={"simulated": True, "recipient": request.recipient.name},
            )

        self._states[provider_txn_id] = result
        return result

    async def get_status(self, provider_transaction_id: str) -> PaymentResult:
        current = self._states.get(provider_transaction_id)
        if current is None:
            return PaymentResult(
                status=PaymentStatus.FAILED,
                provider_status="mock_unknown_txn",
                provider_transaction_id=provider_transaction_id,
                failure_reason="Mock provider: unknown transaction id",
            )
        # Simulate progression: PROCESSING -> IN_TRANSIT -> SETTLED
        if current.status == PaymentStatus.PROCESSING:
            current = PaymentResult(
                status=PaymentStatus.IN_TRANSIT,
                provider_status="mock_in_transit",
                provider_transaction_id=provider_transaction_id,
                provider_fee=current.provider_fee,
                provider_metadata=current.provider_metadata,
            )
        elif current.status == PaymentStatus.IN_TRANSIT:
            current = PaymentResult(
                status=PaymentStatus.SETTLED,
                provider_status="mock_settled",
                provider_transaction_id=provider_transaction_id,
                provider_fee=current.provider_fee,
                settled_at=datetime.now(timezone.utc),
                provider_metadata=current.provider_metadata,
            )
        self._states[provider_transaction_id] = current
        return current

    async def cancel(self, provider_transaction_id: str) -> PaymentResult:
        current = self._states.get(provider_transaction_id)
        if current and current.status in (PaymentStatus.PROCESSING, PaymentStatus.PENDING):
            result = PaymentResult(
                status=PaymentStatus.CANCELLED,
                provider_status="mock_cancelled",
                provider_transaction_id=provider_transaction_id,
                provider_metadata={"simulated": True, "cancelled": True},
            )
            self._states[provider_transaction_id] = result
            return result
        return PaymentResult(
            status=PaymentStatus.FAILED,
            provider_status="mock_cancel_failed",
            provider_transaction_id=provider_transaction_id,
            failure_reason=f"Mock provider: cannot cancel in status {current.status.value if current else 'unknown'}",
        )

    async def handle_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> Optional[PaymentResult]:
        # Mock webhook: expects {"txn_id": "...", "status": "settled" | "failed" | ...}
        txn_id = payload.get("txn_id")
        new_status = payload.get("status")
        if not txn_id or not new_status:
            return None
        try:
            mapped = PaymentStatus(new_status)
        except ValueError:
            return None
        current = self._states.get(txn_id)
        settled_at = datetime.now(timezone.utc) if mapped == PaymentStatus.SETTLED else None
        result = PaymentResult(
            status=mapped,
            provider_status=f"mock_webhook_{new_status}",
            provider_transaction_id=txn_id,
            provider_fee=current.provider_fee if current else None,
            settled_at=settled_at,
            failure_reason=payload.get("failure_reason") if mapped == PaymentStatus.FAILED else None,
            provider_metadata={"simulated": True, "via_webhook": True, **(payload.get("metadata") or {})},
        )
        self._states[txn_id] = result
        return result


class MockRemittanceProvider(RemittanceProvider):
    """Simulates an async remittance provider (CRA source deductions etc.)."""

    name = "mock"

    def __init__(self, fail_rate: Optional[float] = None):
        self.fail_rate = fail_rate if fail_rate is not None else _env_float("MOCK_REMIT_FAIL_RATE", 0.0)
        self.instant_settle = _env_flag("MOCK_INSTANT_SETTLE", False)
        self._states: dict[str, PaymentResult] = {}

    async def send_remittance(self, request: RemittanceRequest, source: SourceAccount) -> PaymentResult:
        await asyncio.sleep(0.05)
        provider_txn_id = f"mock_rmt_{uuid.uuid4().hex[:16]}"

        if random.random() < self.fail_rate:
            result = PaymentResult(
                status=PaymentStatus.FAILED,
                provider_status="mock_rejected",
                provider_transaction_id=provider_txn_id,
                failure_reason=f"Mock provider: {request.authority} rejected (invalid account reference).",
                provider_metadata={"simulated": True, "authority": request.authority},
            )
        else:
            status = PaymentStatus.SETTLED if self.instant_settle else PaymentStatus.PROCESSING
            result = PaymentResult(
                status=status,
                provider_status="mock_accepted",
                provider_transaction_id=provider_txn_id,
                provider_fee=Decimal("3.00"),
                settled_at=datetime.now(timezone.utc) if status == PaymentStatus.SETTLED else None,
                provider_metadata={"simulated": True, "authority": request.authority, "period": request.period},
            )

        self._states[provider_txn_id] = result
        return result

    async def get_status(self, provider_transaction_id: str) -> PaymentResult:
        current = self._states.get(provider_transaction_id)
        if current is None:
            return PaymentResult(
                status=PaymentStatus.FAILED,
                provider_status="mock_unknown_txn",
                provider_transaction_id=provider_transaction_id,
                failure_reason="Mock provider: unknown remittance id",
            )
        if current.status == PaymentStatus.PROCESSING:
            current = PaymentResult(
                status=PaymentStatus.SETTLED,
                provider_status="mock_settled",
                provider_transaction_id=provider_transaction_id,
                provider_fee=current.provider_fee,
                settled_at=datetime.now(timezone.utc),
                provider_metadata=current.provider_metadata,
            )
        self._states[provider_transaction_id] = current
        return current

    async def handle_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> Optional[PaymentResult]:
        txn_id = payload.get("txn_id")
        new_status = payload.get("status")
        if not txn_id or not new_status:
            return None
        try:
            mapped = PaymentStatus(new_status)
        except ValueError:
            return None
        settled_at = datetime.now(timezone.utc) if mapped == PaymentStatus.SETTLED else None
        result = PaymentResult(
            status=mapped,
            provider_status=f"mock_webhook_{new_status}",
            provider_transaction_id=txn_id,
            settled_at=settled_at,
            failure_reason=payload.get("failure_reason") if mapped == PaymentStatus.FAILED else None,
            provider_metadata={"simulated": True, "via_webhook": True},
        )
        self._states[txn_id] = result
        return result
