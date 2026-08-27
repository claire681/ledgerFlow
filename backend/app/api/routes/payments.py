"""
Payments router.

Endpoints (all under /api/v1):
    POST   /payments                 Record a new payment (deducts from bank account)
    GET    /payments                 List payments for current user (paginated)
    GET    /payments/{id}            Get one payment
    PATCH  /payments/{id}            Update notes/cheque_no (limited fields)
    POST   /payments/{id}/void       Void a payment (refunds bank account balance)

All queries scoped by owner_id = current_user.id.

Balance handling: POST /payments deducts from the linked bank_account.current_balance
in the same transaction as the insert. If the account is missing, we still record the
payment (bank_account_id stays NULL) so nothing is lost.

Insufficient funds are NOT blocked. Frontend shows a warning but the save proceeds
(business owners may have overdraft, or Novala's balance may be stale vs bank reality).
"""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Payment, PaymentAuditLog, BankAccount, User
from app.core.security import get_current_user
from app.services.payments import RemittanceService, SourceAccount, retry_remittance, RETRYABLE_STATUSES, MAX_RETRY_ATTEMPTS, approve_payment, reject_payment, can_approve


router = APIRouter(tags=["payments"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PaymentCreate(BaseModel):
    bank_account_id: Optional[UUID] = None
    source_type: str = Field(..., min_length=1, max_length=50)      # e.g. "pd7a"
    source_ref: Optional[str] = Field(default=None, max_length=100) # e.g. "PD7A-2026-08"
    source_name: str = Field(..., min_length=1, max_length=200)     # display name
    amount: Decimal = Field(..., gt=0)
    payment_date: date
    cheque_no: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = None
    print_cheque_queue: bool = False
    provider: str = "manual"     # "manual" | "mock" | ... (future: "vopay", "plooto", ...)


class PaymentUpdate(BaseModel):
    cheque_no: Optional[str] = None
    notes: Optional[str] = None


class VoidRequest(BaseModel):
    reason: Optional[str] = None


class ApprovalRequest(BaseModel):
    reason: Optional[str] = None


class RejectionRequest(BaseModel):
    reason: str


class AuditLogResponse(BaseModel):
    id: UUID
    payment_id: UUID
    event_type: str
    from_status: Optional[str]
    to_status: Optional[str]
    actor_type: str
    actor_id: Optional[UUID]
    details: Optional[dict]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class PaymentResponse(BaseModel):
    id: UUID
    bank_account_id: Optional[UUID]
    source_type: str
    source_ref: Optional[str]
    source_name: str
    amount: Decimal
    payment_date: date
    cheque_no: Optional[str]
    notes: Optional[str]
    print_cheque_queue: bool
    status: str
    voided_at: Optional[datetime]
    voided_reason: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payload: PaymentCreate,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a new payment.

    Routes through RemittanceService which handles adapter selection, audit
    logging, and status tracking. The manual adapter records the payment as
    "recorded" and leaves it to the user to complete outside Novala.
    """
    # Verify the bank account belongs to this user, if one was provided
    if payload.bank_account_id is not None:
        stmt = select(BankAccount).where(
            BankAccount.id == payload.bank_account_id,
            BankAccount.user_id == current_user.id,
            BankAccount.is_active == True,
        )
        result = await db.execute(stmt)
        account = result.scalar_one_or_none()
        if not account:
            raise HTTPException(
                status_code=404,
                detail="Bank account not found or has been deleted",
            )
        source_bank = SourceAccount(
            bank_account_id=account.id,
            display_name=account.name,
        )
    else:
        # No bank account chosen -- create a placeholder source
        source_bank = SourceAccount(
            bank_account_id=None,   # type: ignore
            display_name="(no account selected)",
        )

    # Map source_type -> authority. Only pd7a mapped so far; others fall through.
    authority_map = {
        "pd7a": "cra_source_deductions",
        "gst_hst": "cra_gst_hst",
        "wcb": "wcb_alberta",
    }
    authority = authority_map.get(payload.source_type, payload.source_type)

    # Account reference for CRA remittances comes from the user's profile.
    # For other authorities, use source_ref if provided.
    if payload.source_type in ("pd7a", "gst_hst"):
        account_reference = current_user.cra_payroll_account or (payload.source_ref or "")
    else:
        account_reference = payload.source_ref or ""

    # Period = YYYY-MM of payment date (frontend can override via source_ref)
    period = payload.source_ref if payload.source_ref and "-" in payload.source_ref else payload.payment_date.strftime("%Y-%m")

    service = RemittanceService(db)
    payment = await service.initiate(
        user_id=current_user.id,
        provider_name=payload.provider,
        bank_account_id=payload.bank_account_id,
        source_type=payload.source_type,
        source_ref=payload.source_ref,
        source_name=payload.source_name,
        amount=payload.amount,
        payment_date=payload.payment_date,
        authority=authority,
        account_reference=account_reference,
        period=period,
        source_bank=source_bank,
        cheque_no=payload.cheque_no,
        notes=payload.notes,
        print_cheque_queue=payload.print_cheque_queue,
        idempotency_key=idempotency_key,
    )
    return payment


@router.get("/payments", response_model=List[PaymentResponse])
async def list_payments(
    limit: int = 100,
    offset: int = 0,
    source_type: Optional[str] = None,
    status: Optional[str] = None,
    bank_account_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List payments for the current user. Newest first."""
    stmt = select(Payment).where(Payment.owner_id == current_user.id)
    if source_type:
        stmt = stmt.where(Payment.source_type == source_type)
    if status:
        stmt = stmt.where(Payment.status == status)
    if bank_account_id:
        stmt = stmt.where(Payment.bank_account_id == bank_account_id)
    stmt = stmt.order_by(Payment.payment_date.desc(), Payment.created_at.desc())
    stmt = stmt.limit(min(limit, 500)).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get one payment by id."""
    stmt = select(Payment).where(
        Payment.id == payment_id,
        Payment.owner_id == current_user.id,
    )
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.patch("/payments/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: UUID,
    payload: PaymentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update limited fields on a payment (notes, cheque_no).
    Amount/date/account cannot be changed — void and re-create instead."""
    stmt = select(Payment).where(
        Payment.id == payment_id,
        Payment.owner_id == current_user.id,
    )
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status != "recorded":
        raise HTTPException(status_code=400, detail="Cannot update a voided payment")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(payment, field, value)

    await db.commit()
    await db.refresh(payment)
    return payment


@router.post("/payments/{payment_id}/retry", response_model=PaymentResponse)
async def retry_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retry a failed/cancelled/needs_action payment.

    Creates a NEW Payment record linked to the original via parent_payment_id.
    Original payment is unchanged (audit trail preserved).
    """
    # Load the original
    stmt = select(Payment).where(
        Payment.id == payment_id,
        Payment.owner_id == current_user.id,
    )
    original = (await db.execute(stmt)).scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Payment not found")

    if original.status not in RETRYABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Payment status '{original.status}' is not retryable. Must be failed, cancelled, or needs_action.",
        )
    if original.retry_count >= MAX_RETRY_ATTEMPTS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum retry attempts ({MAX_RETRY_ATTEMPTS}) already reached for this payment chain.",
        )

    # Rebuild the source_bank + authority + account_reference + period
    if original.bank_account_id is not None:
        bank_stmt = select(BankAccount).where(BankAccount.id == original.bank_account_id)
        account = (await db.execute(bank_stmt)).scalar_one_or_none()
        if not account:
            raise HTTPException(status_code=400, detail="Original bank account no longer exists")
        source_bank = SourceAccount(bank_account_id=account.id, display_name=account.name)
    else:
        source_bank = SourceAccount(bank_account_id=None, display_name="(no account selected)")  # type: ignore

    authority_map = {
        "pd7a": "cra_source_deductions",
        "gst_hst": "cra_gst_hst",
        "wcb": "wcb_alberta",
    }
    authority = authority_map.get(original.source_type, original.source_type)

    if original.source_type in ("pd7a", "gst_hst"):
        account_reference = current_user.cra_payroll_account or (original.source_ref or "")
    else:
        account_reference = original.source_ref or ""

    period = original.source_ref if original.source_ref and "-" in original.source_ref else original.payment_date.strftime("%Y-%m")

    new_payment = await retry_remittance(
        db, original,
        authority=authority,
        account_reference=account_reference,
        period=period,
        source_bank=source_bank,
    )
    return new_payment


@router.get("/payments/pending-approval", response_model=List[PaymentResponse])
async def list_pending_approval(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all payments awaiting approval that the current user can act on.

    Only visible to users with owner/admin role. Excludes payments the user
    created (segregation of duties would prevent them from approving anyway).
    """
    if not can_approve(current_user):
        return []
    stmt = select(Payment).where(
        Payment.status == "pending_approval",
        Payment.owner_id != current_user.id,
    ).order_by(Payment.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/payments/{payment_id}/audit-log", response_model=List[AuditLogResponse])
async def get_payment_audit_log(
    payment_id: UUID,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get audit log entries for a payment, newest first.

    Includes every event: created, status_changed, approved, rejected, retry,
    webhook_received, etc. Owner-scoped: only the payment creator can see the log.
    """
    # First verify the payment exists and belongs to this user
    stmt = select(Payment).where(
        Payment.id == payment_id,
        Payment.owner_id == current_user.id,
    )
    payment = (await db.execute(stmt)).scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    log_stmt = (
        select(PaymentAuditLog)
        .where(PaymentAuditLog.payment_id == payment_id)
        .order_by(PaymentAuditLog.created_at.desc())
        .limit(min(limit, 500))
        .offset(offset)
    )
    result = await db.execute(log_stmt)
    return result.scalars().all()


@router.post("/payments/{payment_id}/approve", response_model=PaymentResponse)
async def approve_payment_endpoint(
    payment_id: UUID,
    payload: ApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a payment awaiting approval."""
    stmt = select(Payment).where(Payment.id == payment_id)
    payment = (await db.execute(stmt)).scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    try:
        return await approve_payment(db, payment, current_user, payload.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payments/{payment_id}/reject", response_model=PaymentResponse)
async def reject_payment_endpoint(
    payment_id: UUID,
    payload: RejectionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject a payment awaiting approval. Reason is required."""
    stmt = select(Payment).where(Payment.id == payment_id)
    payment = (await db.execute(stmt)).scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    try:
        return await reject_payment(db, payment, current_user, payload.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payments/{payment_id}/void", response_model=PaymentResponse)
async def void_payment(
    payment_id: UUID,
    payload: VoidRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Void a payment. Refunds the amount to the bank account balance."""
    stmt = select(Payment).where(
        Payment.id == payment_id,
        Payment.owner_id == current_user.id,
    )
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status == "voided":
        raise HTTPException(status_code=400, detail="Payment is already voided")

    # Refund the balance if the account still exists
    if payment.bank_account_id is not None:
        acct_stmt = select(BankAccount).where(
            BankAccount.id == payment.bank_account_id,
            BankAccount.user_id == current_user.id,
        )
        acct_result = await db.execute(acct_stmt)
        account = acct_result.scalar_one_or_none()
        if account is not None:
            account.current_balance = Decimal(account.current_balance) + Decimal(payment.amount)

    payment.status = "voided"
    payment.voided_at = datetime.utcnow()
    payment.voided_reason = payload.reason

    await db.commit()
    await db.refresh(payment)
    return payment