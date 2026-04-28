import asyncio
from app.db.database import AsyncSessionLocal
from sqlalchemy import text

async def clean():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text('DELETE FROM invoices'))
        await db.commit()
        print('Deleted all invoices. Rows affected:', result.rowcount)

asyncio.run(clean())
