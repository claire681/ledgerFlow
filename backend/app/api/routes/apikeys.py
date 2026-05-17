from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from pydantic import BaseModel
from typing import Optional, List
import secrets
import hashlib

router = APIRouter(prefix="/apikeys", tags=["apikeys"])

class APIKeyBody(BaseModel):
    name: str
    permissions: Optional[List[str]] = ["read"]
    expires_days: Optional[int] = None

def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

@router.get("/")
async def list_keys(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT id, name, key_preview, permissions, last_used_at, expires_at, is_active, created_at FROM api_keys WHERE user_id=:uid ORDER BY created_at DESC"), {"uid": str(current_user.id)})
    return [dict(r) for r in result.mappings().all()]

@router.post("/")
async def create_key(body: APIKeyBody, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    raw_key = f"nv_{secrets.token_urlsafe(32)}"
    key_hash = hash_key(raw_key)
    key_preview = f"{raw_key[:8]}...{raw_key[-4:]}"
    expires_at = None
    if body.expires_days:
        from datetime import datetime, timedelta
        expires_at = datetime.utcnow() + timedelta(days=body.expires_days)
    result = await db.execute(text("""
        INSERT INTO api_keys (user_id, name, key_hash, key_preview, permissions, expires_at)
        VALUES (:uid, :name, :key_hash, :key_preview, :permissions, :expires_at)
        RETURNING id, name, key_preview, permissions, expires_at, is_active, created_at
    """), {"uid": str(current_user.id), "name": body.name, "key_hash": key_hash, "key_preview": key_preview, "permissions": body.permissions, "expires_at": expires_at})
    await db.commit()
    row = dict(result.mappings().first())
    row["raw_key"] = raw_key
    return row

@router.delete("/{key_id}")
async def delete_key(key_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM api_keys WHERE id=:id AND user_id=:uid"), {"id": key_id, "uid": str(current_user.id)})
    await db.commit()
    return {"success": True}

@router.patch("/{key_id}/toggle")
async def toggle_key(key_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("UPDATE api_keys SET is_active = NOT is_active WHERE id=:id AND user_id=:uid RETURNING is_active"), {"id": key_id, "uid": str(current_user.id)})
    await db.commit()
    row = result.mappings().first()
    if not row: raise HTTPException(404, "Key not found")
    return {"is_active": row["is_active"]}
