from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import get_current_user
from app.api.routes.team import get_data_owner_id
from app.models.models import User
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/customers", tags=["customers"])

class CustomerBody(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None

@router.get("/")
async def list_customers(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM customers WHERE user_id = :uid ORDER BY created_at DESC"), {"uid": str(current_user.id)})
    rows = result.mappings().all()
    return [dict(r) for r in rows]

@router.post("/")
async def create_customer(body: CustomerBody, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        INSERT INTO customers (user_id, name, email, phone, address, company, notes)
        VALUES (:uid, :name, :email, :phone, :address, :company, :notes)
        RETURNING *
    """), {"uid": str(current_user.id), "name": body.name, "email": body.email, "phone": body.phone, "address": body.address, "company": body.company, "notes": body.notes})
    await db.commit()
    return dict(result.mappings().first())

@router.patch("/{customer_id}")
async def update_customer(customer_id: str, body: CustomerBody, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        UPDATE customers SET name=:name, email=:email, phone=:phone, address=:address, company=:company, notes=:notes, updated_at=NOW()
        WHERE id=:id AND user_id=:uid RETURNING *
    """), {"id": customer_id, "uid": str(current_user.id), "name": body.name, "email": body.email, "phone": body.phone, "address": body.address, "company": body.company, "notes": body.notes})
    await db.commit()
    row = result.mappings().first()
    if not row: raise HTTPException(404, "Customer not found")
    return dict(row)

@router.delete("/{customer_id}")
async def delete_customer(customer_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM customers WHERE id=:id AND user_id=:uid"), {"id": customer_id, "uid": str(current_user.id)})
    await db.commit()
    return {"success": True}
