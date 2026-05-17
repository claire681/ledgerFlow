from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/businesses", tags=["businesses"])

class BusinessBody(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    currency: Optional[str] = "CAD"
    tax_number: Optional[str] = None
    logo_url: Optional[str] = None

@router.get("/")
async def list_businesses(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        SELECT b.* FROM businesses b
        JOIN user_businesses ub ON ub.business_id = b.id
        WHERE ub.user_id = :uid
        ORDER BY b.created_at DESC
    """), {"uid": str(current_user.id)})
    return [dict(r) for r in result.mappings().all()]

@router.post("/")
async def create_business(body: BusinessBody, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        INSERT INTO businesses (owner_id, name, email, phone, address, currency, tax_number, logo_url)
        VALUES (:uid, :name, :email, :phone, :address, :currency, :tax_number, :logo_url)
        RETURNING *
    """), {"uid": str(current_user.id), "name": body.name, "email": body.email, "phone": body.phone, "address": body.address, "currency": body.currency, "tax_number": body.tax_number, "logo_url": body.logo_url})
    await db.commit()
    business = dict(result.mappings().first())
    await db.execute(text("INSERT INTO user_businesses (user_id, business_id, role) VALUES (:uid, :bid, 'owner')"), {"uid": str(current_user.id), "bid": business["id"]})
    await db.commit()
    return business

@router.patch("/{business_id}")
async def update_business(business_id: str, body: BusinessBody, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        UPDATE businesses SET name=:name, email=:email, phone=:phone, address=:address, currency=:currency, tax_number=:tax_number, logo_url=:logo_url
        WHERE id=:id AND owner_id=:uid RETURNING *
    """), {"id": business_id, "uid": str(current_user.id), "name": body.name, "email": body.email, "phone": body.phone, "address": body.address, "currency": body.currency, "tax_number": body.tax_number, "logo_url": body.logo_url})
    await db.commit()
    row = result.mappings().first()
    if not row: raise HTTPException(404, "Business not found")
    return dict(row)

@router.delete("/{business_id}")
async def delete_business(business_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM businesses WHERE id=:id AND owner_id=:uid"), {"id": business_id, "uid": str(current_user.id)})
    await db.commit()
    return {"success": True}
