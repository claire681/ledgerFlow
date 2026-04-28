from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import Transaction
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# ── Schemas ───────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    vendor:       Optional[str]   = None
    amount:       float
    currency:     Optional[str]   = "USD"
    txn_date:     Optional[str]   = None
    category:     Optional[str]   = None
    txn_type:     Optional[str]   = "expense"
    notes:        Optional[str]   = None
    is_recurring: Optional[bool]  = False
    document_id:  Optional[str]   = None


class TransactionUpdate(BaseModel):
    vendor:       Optional[str]   = None
    amount:       Optional[float] = None
    currency:     Optional[str]   = None
    txn_date:     Optional[str]   = None
    category:     Optional[str]   = None
    txn_type:     Optional[str]   = None
    notes:        Optional[str]   = None
    status:       Optional[str]   = None
    is_recurring: Optional[bool]  = None


# ── Helper ────────────────────────────────────────────────────────────────

def txn_to_dict(t: Transaction) -> dict:
    txn_type = t.txn_type or "expense"
    if txn_type.upper() == "EXPENSE":
        txn_type = "expense"
    if txn_type.upper() == "INCOME":
        txn_type = "income"

    category = t.category
    if not category or category.lower() in ("other", "none", ""):
        category = None

    ml_category = t.ml_category
    if ml_category:
        ml_lower = ml_category.lower()
        if txn_type == "expense" and ml_lower in ("revenue", "income"):
            ml_category = category or "Expense"
        if txn_type == "income" and ml_lower in ("expense", "cost"):
            ml_category = "Income"

    return {
        "id":           str(t.id),
        "user_id":      str(t.user_id),
        "document_id":  str(t.document_id) if t.document_id else None,
        "vendor":       t.vendor,
        "amount":       float(t.amount) if t.amount is not None else 0.0,
        "currency":     t.currency or "USD",
        "txn_date":     t.txn_date,
        "category":     category,
        "ml_category":  ml_category,
        "txn_type":     txn_type,
        "status":       t.status or "ok",
        "notes":        t.notes,
        "is_recurring": t.is_recurring or False,
        "created_at":   t.created_at.isoformat() if t.created_at else None,
        "updated_at":   t.updated_at.isoformat() if t.updated_at else None,
    }


async def check_duplicate(
    db: AsyncSession,
    user_id: str,
    document_id: Optional[str],
    vendor: str,
    amount: float,
    txn_date: str,
) -> bool:
    if document_id:
        result = await db.execute(
            select(Transaction).where(
                Transaction.user_id     == user_id,
                Transaction.document_id == document_id,
            )
        )
        if result.scalar_one_or_none():
            return True

    if vendor and amount and txn_date:
        result = await db.execute(
            select(Transaction).where(
                Transaction.user_id  == user_id,
                Transaction.vendor   == vendor,
                Transaction.amount   == amount,
                Transaction.txn_date == txn_date,
            )
        )
        if result.scalar_one_or_none():
            return True

    return False


# ── LIST ──────────────────────────────────────────────────────────────────

@router.get("/")
async def list_transactions(
    current_user=Depends(get_current_user),
    db:           AsyncSession  = Depends(get_db),
    status:       Optional[str] = None,
    category:     Optional[str] = None,
    txn_type:     Optional[str] = None,
    skip:         int           = 0,
    limit:        int           = 100,
):
    try:
        user_id = str(current_user.id)
        query = select(Transaction).where(Transaction.user_id == user_id)
        if status:
            query = query.where(Transaction.status == status)
        if category:
            query = query.where(Transaction.category == category)
        if txn_type:
            query = query.where(Transaction.txn_type == txn_type)

        query  = query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        txns   = result.scalars().all()
        return [txn_to_dict(t) for t in txns]
    except Exception as e:
        print(f"List transactions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── CREATE ────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_transaction(
    body:         TransactionCreate,
    current_user=Depends(get_current_user),
    db:           AsyncSession    = Depends(get_db),
):
    try:
        user_id = str(current_user.id)
        amount  = float(body.amount) if body.amount is not None else 0.0
        txn_type = body.txn_type or ("income" if amount > 0 else "expense")
        txn_type = txn_type.lower()

        is_dup = await check_duplicate(
            db, user_id, body.document_id,
            body.vendor or "", amount,
            body.txn_date or datetime.utcnow().strftime("%Y-%m-%d"),
        )
        if is_dup:
            raise HTTPException(
                status_code=409,
                detail="Duplicate transaction already exists"
            )

        category = body.category
        if category and category.lower() in ("other", "none", "revenue") and txn_type == "expense":
            category = None
        if category and category.lower() in ("expense", "cost") and txn_type == "income":
            category = "Income"

        ml_category = category

        txn = Transaction(
            id           = str(uuid.uuid4()),
            user_id      = user_id,
            document_id  = body.document_id,
            vendor       = body.vendor,
            amount       = amount,
            currency     = body.currency or "USD",
            txn_date     = body.txn_date or datetime.utcnow().strftime("%Y-%m-%d"),
            category     = category,
            ml_category  = ml_category,
            txn_type     = txn_type,
            notes        = body.notes,
            is_recurring = body.is_recurring or False,
            status       = "ok",
        )
        db.add(txn)
        await db.commit()
        await db.refresh(txn)
        return txn_to_dict(txn)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create transaction error: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── GET single ────────────────────────────────────────────────────────────

@router.get("/{txn_id}")
async def get_transaction(
    txn_id:       str,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    result = await db.execute(
        select(Transaction).where(
            Transaction.id      == txn_id,
            Transaction.user_id == user_id,
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn_to_dict(txn)


# ── UPDATE ────────────────────────────────────────────────────────────────

@router.patch("/{txn_id}")
async def update_transaction(
    txn_id:       str,
    body:         TransactionUpdate,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    result = await db.execute(
        select(Transaction).where(
            Transaction.id      == txn_id,
            Transaction.user_id == user_id,
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if body.vendor       is not None: txn.vendor       = body.vendor
    if body.amount       is not None: txn.amount       = float(body.amount)
    if body.currency     is not None: txn.currency     = body.currency
    if body.txn_date     is not None: txn.txn_date     = body.txn_date
    if body.notes        is not None: txn.notes        = body.notes
    if body.status       is not None: txn.status       = body.status
    if body.is_recurring is not None: txn.is_recurring = body.is_recurring

    if body.txn_type is not None:
        txn.txn_type = body.txn_type.lower()
    if body.category is not None:
        txn.category    = body.category
        txn.ml_category = body.category

    await db.commit()
    await db.refresh(txn)
    return txn_to_dict(txn)


# ── DELETE ────────────────────────────────────────────────────────────────

@router.delete("/{txn_id}", status_code=204)
async def delete_transaction(
    txn_id:       str,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    result = await db.execute(
        select(Transaction).where(
            Transaction.id      == txn_id,
            Transaction.user_id == user_id,
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    await db.delete(txn)
    await db.commit()


# ── DELETE BY VENDOR/AMOUNT ───────────────────────────────────────────────

@router.delete("/by-details/delete")
async def delete_by_details(
    vendor:       Optional[str]   = None,
    amount:       Optional[float] = None,
    txn_date:     Optional[str]   = None,
    current_user=Depends(get_current_user),
    db:           AsyncSession    = Depends(get_db),
):
    user_id = str(current_user.id)
    query = select(Transaction).where(Transaction.user_id == user_id)
    if vendor:
        query = query.where(Transaction.vendor.ilike(f"%{vendor}%"))
    if amount:
        query = query.where(Transaction.amount == amount)
    if txn_date:
        query = query.where(Transaction.txn_date == txn_date)

    result = await db.execute(query)
    txns   = result.scalars().all()

    if not txns:
        raise HTTPException(status_code=404, detail="No matching transaction found")
    if len(txns) > 1:
        return {
            "status":  "multiple_found",
            "message": f"Found {len(txns)} matching transactions. Please specify by ID.",
            "matches": [txn_to_dict(t) for t in txns],
        }

    await db.delete(txns[0])
    await db.commit()
    return {"status": "deleted", "message": "Transaction deleted successfully"}


# ── CATEGORIZE ────────────────────────────────────────────────────────────

@router.post("/{txn_id}/categorize")
async def ml_categorize(
    txn_id:       str,
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    user_id = str(current_user.id)
    result = await db.execute(
        select(Transaction).where(
            Transaction.id      == txn_id,
            Transaction.user_id == user_id,
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    ml_category = txn.category
    try:
        from app.services.ml.categorizer import categorizer
        ml_result   = categorizer.predict(txn.vendor or "", txn.category or "")
        suggested   = ml_result.get("category")
        if suggested and suggested.lower() not in ("other", "revenue", "income") \
                and txn.txn_type == "expense":
            txn.ml_category = suggested
            ml_category     = suggested
        elif suggested and txn.txn_type == "income":
            txn.ml_category = "Income"
            ml_category     = "Income"
    except Exception:
        pass

    await db.commit()
    return {"category": ml_category, "transaction_id": txn_id}


# ── IMPORT CSV ────────────────────────────────────────────────────────────

@router.post("/import-csv")
async def import_csv(
    file:         UploadFile   = File(...),
    current_user=Depends(get_current_user),
    db:           AsyncSession = Depends(get_db),
):
    import csv
    import io

    user_id = str(current_user.id)
    content = await file.read()
    text    = content.decode("utf-8", errors="ignore")
    reader  = csv.DictReader(io.StringIO(text))
    created = 0
    skipped = 0

    for row in reader:
        try:
            vendor = (
                row.get("Description") or row.get("Merchant") or
                row.get("Payee")       or row.get("Name")      or "Unknown"
            )
            amount_str = (
                row.get("Amount") or row.get("Debit") or
                row.get("Credit") or "0"
            )
            date_str   = row.get("Date") or row.get("Transaction Date") or ""
            amount_str = amount_str.replace("$", "").replace(",", "").strip()
            if not amount_str:
                continue

            amount   = float(amount_str)
            txn_date = date_str[:50] if date_str else datetime.utcnow().strftime("%Y-%m-%d")
            txn_type = "income" if amount > 0 else "expense"

            is_dup = await check_duplicate(
                db, user_id, None,
                vendor, abs(amount), txn_date,
            )
            if is_dup:
                skipped += 1
                continue

            ml_category = None
            try:
                from app.services.ml.categorizer import categorizer
                ml_result   = categorizer.predict(vendor, "")
                ml_category = ml_result.get("category")
                if ml_category and ml_category.lower() in ("revenue", "income") \
                        and txn_type == "expense":
                    ml_category = None
            except Exception:
                pass

            txn = Transaction(
                id          = str(uuid.uuid4()),
                user_id     = user_id,
                vendor      = vendor[:255],
                amount      = abs(amount),
                currency    = "USD",
                txn_date    = txn_date,
                txn_type    = txn_type,
                ml_category = ml_category,
                status      = "ok",
            )
            db.add(txn)
            created += 1

        except Exception as e:
            print(f"CSV row error: {e}")
            continue

    await db.commit()
    return {
        "imported": created,
        "skipped":  skipped,
        "message":  f"Imported {created} transactions. Skipped {skipped} duplicates.",
    }