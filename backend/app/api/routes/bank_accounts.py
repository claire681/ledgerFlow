"""
Bank Accounts CRUD router.

Endpoints (all under /api/v1):
    GET    /bank-accounts              List active bank accounts for current user
    POST   /bank-accounts              Create a new bank account
    GET    /bank-accounts/{id}         Get one bank account
    PATCH  /bank-accounts/{id}         Update a bank account
    DELETE /bank-accounts/{id}         Soft delete (sets is_active=False)

Owner scoping: every query filters by user_id = current_user.id.
Default account: setting is_default=True on one account sets others to False.
"""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import BankAccount, User
from app.core.security import get_current_user


router = APIRouter(tags=["bank-accounts"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

VALID_TYPES = {"chequing", "savings", "credit", "other"}


class BankAccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    type: str = Field(default="chequing")
    institution: str = Field(..., min_length=1, max_length=100)
    last_4: Optional[str] = Field(default=None, max_length=4)
    opening_balance: Decimal = Field(default=Decimal("0"))
    is_default: bool = Field(default=False)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        if v not in VALID_TYPES:
            raise ValueError(f"type must be one of {sorted(VALID_TYPES)}")
        return v

    @field_validator("last_4")
    @classmethod
    def validate_last_4(cls, v):
        if v is None or v == "":
            return None
        if not v.isdigit() or len(v) != 4:
            raise ValueError("last_4 must be exactly 4 digits")
        return v


class BankAccountCreate(BankAccountBase):
    pass


class BankAccountUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    type: Optional[str] = None
    institution: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_4: Optional[str] = Field(default=None, max_length=4)
    opening_balance: Optional[Decimal] = None
    current_balance: Optional[Decimal] = None
    is_default: Optional[bool] = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        if v is None:
            return v
        if v not in VALID_TYPES:
            raise ValueError(f"type must be one of {sorted(VALID_TYPES)}")
        return v

    @field_validator("last_4")
    @classmethod
    def validate_last_4(cls, v):
        if v is None or v == "":
            return None
        if not v.isdigit() or len(v) != 4:
            raise ValueError("last_4 must be exactly 4 digits")
        return v


class BankAccountResponse(BaseModel):
    id: UUID
    name: str
    type: str
    institution: str
    last_4: Optional[str]
    opening_balance: Decimal
    current_balance: Decimal
    is_default: bool
    is_active: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _clear_other_defaults(db: AsyncSession, user_id: UUID, exclude_id: Optional[UUID] = None):
    """When setting an account as default, unset all others for this user."""
    stmt = update(BankAccount).where(
        BankAccount.user_id == user_id,
        BankAccount.is_default == True,
    ).values(is_default=False)
    if exclude_id is not None:
        stmt = stmt.where(BankAccount.id != exclude_id)
    await db.execute(stmt)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/bank-accounts", response_model=List[BankAccountResponse])
async def list_bank_accounts(
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List bank accounts for the current user. Excludes soft-deleted by default."""
    stmt = select(BankAccount).where(BankAccount.user_id == current_user.id)
    if not include_inactive:
        stmt = stmt.where(BankAccount.is_active == True)
    stmt = stmt.order_by(BankAccount.is_default.desc(), BankAccount.created_at.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/bank-accounts", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_account(
    payload: BankAccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new bank account. current_balance is initialized to opening_balance."""
    if payload.is_default:
        await _clear_other_defaults(db, current_user.id)

    account = BankAccount(
        user_id=current_user.id,
        name=payload.name.strip(),
        type=payload.type,
        institution=payload.institution.strip(),
        last_4=payload.last_4,
        opening_balance=payload.opening_balance,
        current_balance=payload.opening_balance,
        is_default=payload.is_default,
        is_active=True,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


@router.get("/bank-accounts/{account_id}", response_model=BankAccountResponse)
async def get_bank_account(
    account_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get one bank account by id."""
    stmt = select(BankAccount).where(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return account


@router.patch("/bank-accounts/{account_id}", response_model=BankAccountResponse)
async def update_bank_account(
    account_id: UUID,
    payload: BankAccountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update fields on a bank account. Only supplied fields are changed."""
    stmt = select(BankAccount).where(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    data = payload.model_dump(exclude_unset=True)

    # Handle is_default: if setting to True, clear others first
    if data.get("is_default") is True:
        await _clear_other_defaults(db, current_user.id, exclude_id=account.id)

    # If opening_balance changes but current_balance not explicitly set,
    # adjust current_balance by the same delta so the running balance stays consistent
    if "opening_balance" in data and "current_balance" not in data:
        delta = Decimal(data["opening_balance"]) - Decimal(account.opening_balance)
        data["current_balance"] = Decimal(account.current_balance) + delta

    for field, value in data.items():
        if field in ("name", "institution") and value is not None:
            value = value.strip()
        setattr(account, field, value)

    await db.commit()
    await db.refresh(account)
    return account


@router.delete("/bank-accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank_account(
    account_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete: sets is_active=False. Existing payments keep the reference."""
    stmt = select(BankAccount).where(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    account.is_active = False
    account.is_default = False  # can't have a deleted default account
    await db.commit()
    return None