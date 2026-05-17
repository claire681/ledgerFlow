from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/inventory", tags=["inventory"])

class InventoryBody(BaseModel):
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = 0
    cost: Optional[float] = 0
    quantity: Optional[int] = 0
    unit: Optional[str] = "unit"
    low_stock_alert: Optional[int] = 10
    status: Optional[str] = "active"

@router.get("/")
async def list_inventory(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM inventory WHERE user_id = :uid ORDER BY created_at DESC"), {"uid": str(current_user.id)})
    return [dict(r) for r in result.mappings().all()]

@router.post("/")
async def create_item(body: InventoryBody, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        INSERT INTO inventory (user_id, name, description, sku, category, price, cost, quantity, unit, low_stock_alert, status)
        VALUES (:uid, :name, :description, :sku, :category, :price, :cost, :quantity, :unit, :low_stock_alert, :status)
        RETURNING *
    """), {"uid": str(current_user.id), "name": body.name, "description": body.description, "sku": body.sku, "category": body.category, "price": body.price, "cost": body.cost, "quantity": body.quantity, "unit": body.unit, "low_stock_alert": body.low_stock_alert, "status": body.status})
    await db.commit()
    return dict(result.mappings().first())

@router.patch("/{item_id}")
async def update_item(item_id: str, body: InventoryBody, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        UPDATE inventory SET name=:name, description=:description, sku=:sku, category=:category, price=:price, cost=:cost, quantity=:quantity, unit=:unit, low_stock_alert=:low_stock_alert, status=:status, updated_at=NOW()
        WHERE id=:id AND user_id=:uid RETURNING *
    """), {"id": item_id, "uid": str(current_user.id), "name": body.name, "description": body.description, "sku": body.sku, "category": body.category, "price": body.price, "cost": body.cost, "quantity": body.quantity, "unit": body.unit, "low_stock_alert": body.low_stock_alert, "status": body.status})
    await db.commit()
    row = result.mappings().first()
    if not row: raise HTTPException(404, "Item not found")
    return dict(row)

@router.delete("/{item_id}")
async def delete_item(item_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM inventory WHERE id=:id AND user_id=:uid"), {"id": item_id, "uid": str(current_user.id)})
    await db.commit()
    return {"success": True}
