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

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Payment, BankAccount, User
from app.core.security import get_current_user


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


class PaymentUpdate(BaseModel):
    cheque_no: Optional[str] = None
    notes: Optional[str] = None


class VoidRequest(BaseModel):
    reason: Optional[str] = None


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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a new payment. Deducts from bank_account.current_balance if linked."""

    # If a bank_account_id was passed, verify it belongs to this user
    account = None
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

    payment = Payment(
        owner_id=current_user.id,
        bank_account_id=payload.bank_account_id,
        source_type=payload.source_type,
        source_ref=payload.source_ref,
        source_name=payload.source_name,
        amount=payload.amount,
        payment_date=payload.payment_date,
        cheque_no=payload.cheque_no,
        notes=payload.notes,
        print_cheque_queue=payload.print_cheque_queue,
        status="recorded",
    )
    db.add(payment)

    # Deduct from account balance in the same transaction
    if account is not None:
        account.current_balance = Decimal(account.current_balance) - Decimal(payload.amount)

    await db.commit()
    await db.refresh(payment)
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