import asyncio
from sqlalchemy import text
from app.db.database import engine

async def run():
    async with engine.begin() as conn:
        # Add missing columns to transactions table
        await conn.execute(text(
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "
            "is_recurring BOOLEAN DEFAULT false"
        ))
        await conn.execute(text(
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "
            "notes TEXT"
        ))
        await conn.execute(text(
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "
            "updated_at TIMESTAMP WITH TIME ZONE"
        ))
        await conn.execute(text(
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "
            "ml_confidence FLOAT"
        ))

        # Add missing columns to documents table
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS "
            "file_size INTEGER"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS "
            "tax_amount FLOAT"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS "
            "confidence FLOAT"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS "
            "suggested_cat VARCHAR"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS "
            "notes TEXT"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS "
            "is_deductible BOOLEAN DEFAULT false"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS "
            "deduction_pct FLOAT DEFAULT 1.0"
        ))

        # Add missing columns to agent_logs table
        await conn.execute(text(
            "ALTER TABLE agent_logs ADD COLUMN IF NOT EXISTS "
            "result TEXT"
        ))

        print("✅ All missing columns added successfully!")

asyncio.run(run())