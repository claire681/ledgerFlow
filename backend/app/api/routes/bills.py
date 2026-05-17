from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/bills", tags=["bills"])

class BillCreate(BaseModel):
    vendor:    str
    amount:    float
    due_date:  str
    category:  Optional[str] = 'General Expense'
    notes:     Optional[str] = None
    recurring: Optional[bool] = False

@router.get("/")
async def get_bills(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT * FROM bills WHERE user_id = :uid ORDER BY due_date ASC"),
        {"uid": current_user.id}
    )
    rows = result.mappings().all()
    return [dict(r) for r in rows]

@router.post("/")
async def create_bill(
    data: BillCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            INSERT INTO bills (user_id, vendor, amount, due_date, category, notes, recurring)
            VALUES (:uid, :vendor, :amount, :due_date, :category, :notes, :recurring)
            RETURNING *
        """),
        {
            "uid":       current_user.id,
            "vendor":    data.vendor,
            "amount":    data.amount,
            "due_date":  data.due_date,
            "category":  data.category,
            "notes":     data.notes,
            "recurring": data.recurring,
        }
    )
    await db.commit()
    row = result.mappings().first()
    return dict(row)

@router.patch("/{bill_id}/pay")
async def mark_bill_paid(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("UPDATE bills SET status='paid', paid_at=NOW() WHERE id=:id AND user_id=:uid"),
        {"id": bill_id, "uid": current_user.id}
    )
    result = await db.execute(
        text("SELECT * FROM bills WHERE id=:id AND user_id=:uid"),
        {"id": bill_id, "uid": current_user.id}
    )
    bill = result.mappings().first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    await db.execute(
        text("""
            INSERT INTO transactions (user_id, vendor, amount, currency, txn_date, category, txn_type, notes)
            VALUES (:uid, :vendor, :amount, 'USD', CURRENT_DATE, :category, 'expense', :notes)
        """),
        {
            "uid":      current_user.id,
            "vendor":   bill["vendor"],
            "amount":   bill["amount"],
            "category": bill["category"],
            "notes":    f"Bill payment: {bill['vendor']}",
        }
    )
    await db.commit()
    return {"success": True, "message": "Bill marked as paid and transaction created"}

@router.delete("/{bill_id}")
async def delete_bill(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("DELETE FROM bills WHERE id=:id AND user_id=:uid"),
        {"id": bill_id, "uid": current_user.id}
    )
    await db.commit()
    return {"success": True}
