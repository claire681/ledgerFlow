import asyncio
from sqlalchemy import text
from app.db.database import engine

async def run():
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path VARCHAR"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS tax_amount FLOAT"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS confidence FLOAT"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS suggested_cat VARCHAR"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_deductible BOOLEAN DEFAULT false"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS deduction_pct FLOAT DEFAULT 1.0"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_date VARCHAR"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS currency VARCHAR DEFAULT 'USD'"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS vendor VARCHAR"
        ))
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS total_amount FLOAT"
        ))
        print("✅ Documents table fixed!")

asyncio.run(run())