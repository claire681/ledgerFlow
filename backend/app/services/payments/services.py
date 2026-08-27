"""
Payment orchestration services.

Two services, one per domain:
- PayrollPaymentService  -- employee/vendor payments
- RemittanceService      -- tax/regulatory remittances (CRA, WCB, GST, ...)

Both do the same job at the coordination level:
    1. Create the Payment DB record (status=pending)
    2. Write an audit log entry (created)
    3. Look up the correct provider adapter by name
    4. Call the adapter
    5. Update the Payment with the adapter's result
    6. Deduct from bank_account.current_balance if not failed/cancelled
    7. Write an audit log entry (status_changed)
    8. Commit and return the Payment

Adapter selection is by string name (payments.provider column). The default
registry includes Manual and Mock. Real provider adapters (VoPay, Plooto, ...)
register themselves here once implemented.
"""
from __future__ import annotations
from datetime import date
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Payment, PaymentAuditLog, BankAccount

from .interfaces import (
    PaymentProvider,
    RemittanceProvider,
    PaymentStatus,
    PaymentResult,
    PayoutRequest,
    RemittanceRequest,
    RecipientAccount,
    SourceAccount,
    TERMINAL_STATUSES,
)
from .adapters import (
    ManualPaymentProvider,
    ManualRemittanceProvider,
    MockPaymentProvider,
    MockRemittanceProvider,
)


# ---------------------------------------------------------------------------
# Adapter registry
# ---------------------------------------------------------------------------

_PAYMENT_ADAPTERS: dict[str, PaymentProvider] = {}
_REMITTANCE_ADAPTERS: dict[str, RemittanceProvider] = {}


def register_payment_provider(name: str, provider: PaymentProvider) -> None:
    _PAYMENT_ADAPTERS[name] = provider


def register_remittance_provider(name: str, provider: RemittanceProvider) -> None:
    _REMITTANCE_ADAPTERS[name] = provider


def get_payment_provider(name: str) -> PaymentProvider:
    provider = _PAYMENT_ADAPTERS.get(name)
    if not provider:
        raise ValueError(f"Unknown payment provider: {name!r}. Registered: {list(_PAYMENT_ADAPTERS)}")
    return provider


def get_remittance_provider(name: str) -> RemittanceProvider:
    provider = _REMITTANCE_ADAPTERS.get(name)
    if not provider:
        raise ValueError(f"Unknown remittance provider: {name!r}. Registered: {list(_REMITTANCE_ADAPTERS)}")
    return provider


# Register built-in adapters on module import
register_payment_provider("manual", ManualPaymentProvider())
register_payment_provider("mock", MockPaymentProvider())
register_remittance_provider("manual", ManualRemittanceProvider())
register_remittance_provider("mock", MockRemittanceProvider())


# ---------------------------------------------------------------------------
# Audit log helper
# ---------------------------------------------------------------------------

def _record_audit(
    db: AsyncSession,
    payment_id: UUID,
    owner_id: UUID,
    event_type: str,
    from_status: Optional[str],
    to_status: Optional[str],
    actor_type: str,
    actor_id: Optional[UUID] = None,
    details: Optional[dict[str, Any]] = None,
) -> None:
    log = PaymentAuditLog(
        payment_id=payment_id,
        owner_id=owner_id,
        event_type=event_type,
        from_status=from_status,
        to_status=to_status,
        actor_type=actor_type,
        actor_id=actor_id,
        details=details,
    )
    db.add(log)


# ---------------------------------------------------------------------------
# Shared apply-result helper
# ---------------------------------------------------------------------------

def _apply_result_to_payment(payment: Payment, result: PaymentResult) -> str:
    """Copy fields from a PaymentResult onto a Payment. Returns the old status
    so the caller can decide whether to write an audit entry."""
    old_status = payment.status
    payment.status = result.status.value
    payment.provider_status = result.provider_status
    if result.provider_transaction_id:
        payment.provider_transaction_id = result.provider_transaction_id
    if result.provider_fee is not None:
        payment.provider_fee = result.provider_fee
    if result.provider_metadata:
        payment.provider_metadata = result.provider_metadata
    if result.failure_reason:
        payment.failure_reason = result.failure_reason
    if result.needs_action_reason:
        payment.needs_action_reason = result.needs_action_reason
    if result.settled_at:
        payment.settled_at = result.settled_at
    return old_status


async def _deduct_bank_balance(db: AsyncSession, bank_account_id: UUID, amount: Decimal) -> None:
    stmt = select(BankAccount).where(BankAccount.id == bank_account_id)
    r = await db.execute(stmt)
    account = r.scalar_one_or_none()
    if account is not None:
        account.current_balance = Decimal(account.current_balance) - Decimal(amount)


# ---------------------------------------------------------------------------
# PayrollPaymentService
# ---------------------------------------------------------------------------

class PayrollPaymentService:
    """Orchestrates employee/vendor payments through a PaymentProvider."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def initiate(
        self,
        *,
        user_id: UUID,
        provider_name: str,
        bank_account_id: Optional[UUID],
        source_type: str,             # "payroll" | "vendor" | ...
        source_ref: Optional[str],
        source_name: str,             # display: recipient name
        amount: Decimal,
        payment_date: date,
        recipient: RecipientAccount,
        source_bank: SourceAccount,
        memo: Optional[str] = None,
        reference: Optional[str] = None,
    ) -> Payment:
        payment = Payment(
            owner_id=user_id,
            bank_account_id=bank_account_id,
            source_type=source_type,
            source_ref=source_ref,
            source_name=source_name,
            amount=amount,
            payment_date=payment_date,
            provider=provider_name,
            status=PaymentStatus.PENDING.value,
        )
        self.db.add(payment)
        await self.db.flush()

        _record_audit(
            self.db, payment.id, user_id,
            event_type="created",
            from_status=None,
            to_status=PaymentStatus.PENDING.value,
            actor_type="user",
            actor_id=user_id,
            details={"provider": provider_name, "amount": str(amount), "recipient": recipient.name},
        )

        adapter = get_payment_provider(provider_name)
        request = PayoutRequest(
            payment_id=payment.id,
            recipient=recipient,
            amount=amount,
            memo=memo,
            reference=reference,
        )
        result = await adapter.send_payout(request, source_bank)

        old_status = _apply_result_to_payment(payment, result)

        if bank_account_id is not None and result.status not in (PaymentStatus.FAILED, PaymentStatus.CANCELLED):
            await _deduct_bank_balance(self.db, bank_account_id, amount)

        if old_status != payment.status:
            _record_audit(
                self.db, payment.id, user_id,
                event_type="status_changed",
                from_status=old_status,
                to_status=payment.status,
                actor_type="provider",
                details={"provider_status": result.provider_status},
            )

        await self.db.commit()
        await self.db.refresh(payment)
        return payment

    async def refresh_status(self, payment: Payment) -> Payment:
        if payment.status in {s.value for s in TERMINAL_STATUSES}:
            return payment
        if not payment.provider_transaction_id:
            return payment
        adapter = get_payment_provider(payment.provider)
        result = await adapter.get_status(payment.provider_transaction_id)
        old_status = _apply_result_to_payment(payment, result)
        if old_status != payment.status:
            _record_audit(
                self.db, payment.id, payment.owner_id,
                event_type="status_changed",
                from_status=old_status,
                to_status=payment.status,
                actor_type="system",
                details={"via": "poll", "provider_status": result.provider_status},
            )
        await self.db.commit()
        await self.db.refresh(payment)
        return payment


# ---------------------------------------------------------------------------
# RemittanceService
# ---------------------------------------------------------------------------

class RemittanceService:
    """Orchestrates tax/regulatory remittances through a RemittanceProvider."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def initiate(
        self,
        *,
        user_id: UUID,
        provider_name: str,
        bank_account_id: Optional[UUID],
        source_type: str,             # "pd7a" | "gst_hst" | "wcb" | ...
        source_ref: Optional[str],
        source_name: str,
        amount: Decimal,
        payment_date: date,
        authority: str,               # "cra_source_deductions" | "wcb_alberta" | ...
        account_reference: str,       # e.g. "746043769RP0001"
        period: str,                  # "2026-08"
        source_bank: SourceAccount,
        cheque_no: Optional[str] = None,
        notes: Optional[str] = None,
        print_cheque_queue: bool = False,
    ) -> Payment:
        payment = Payment(
            owner_id=user_id,
            bank_account_id=bank_account_id,
            source_type=source_type,
            source_ref=source_ref,
            source_name=source_name,
            amount=amount,
            payment_date=payment_date,
            cheque_no=cheque_no,
            notes=notes,
            print_cheque_queue=print_cheque_queue,
            provider=provider_name,
            status=PaymentStatus.PENDING.value,
        )
        self.db.add(payment)
        await self.db.flush()

        _record_audit(
            self.db, payment.id, user_id,
            event_type="created",
            from_status=None,
            to_status=PaymentStatus.PENDING.value,
            actor_type="user",
            actor_id=user_id,
            details={"provider": provider_name, "authority": authority, "period": period, "amount": str(amount)},
        )

        adapter = get_remittance_provider(provider_name)
        request = RemittanceRequest(
            payment_id=payment.id,
            authority=authority,
            account_reference=account_reference,
            amount=amount,
            period=period,
            memo=notes,
        )
        result = await adapter.send_remittance(request, source_bank)

        old_status = _apply_result_to_payment(payment, result)

        if bank_account_id is not None and result.status not in (PaymentStatus.FAILED, PaymentStatus.CANCELLED):
            await _deduct_bank_balance(self.db, bank_account_id, amount)

        if old_status != payment.status:
            _record_audit(
                self.db, payment.id, user_id,
                event_type="status_changed",
                from_status=old_status,
                to_status=payment.status,
                actor_type="provider",
                details={"provider_status": result.provider_status},
            )

        await self.db.commit()
        await self.db.refresh(payment)
        return payment

    async def refresh_status(self, payment: Payment) -> Payment:
        if payment.status in {s.value for s in TERMINAL_STATUSES}:
            return payment
        if not payment.provider_transaction_id:
            return payment
        adapter = get_remittance_provider(payment.provider)
        result = await adapter.get_status(payment.provider_transaction_id)
        old_status = _apply_result_to_payment(payment, result)
        if old_status != payment.status:
            _record_audit(
                self.db, payment.id, payment.owner_id,
                event_type="status_changed",
                from_status=old_status,
                to_status=payment.status,
                actor_type="system",
                details={"via": "poll", "provider_status": result.provider_status},
            )
        await self.db.commit()
        await self.db.refresh(payment)
        return payment
