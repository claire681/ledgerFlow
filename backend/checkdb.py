import asyncio
from app.db.database import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        invoices = await db.execute(text('SELECT invoice_number, status, total FROM invoices'))
        rows = invoices.fetchall()
        print('INVOICES:', len(rows))
        for r in rows:
            print(' ', r.invoice_number, r.status, r.total)

        txns = await db.execute(text('SELECT vendor, amount, txn_type FROM transactions'))
        trows = txns.fetchall()
        print('TRANSACTIONS:', len(trows))
        for r in trows:
            print(' ', r.vendor, r.amount, r.txn_type)

        docs = await db.execute(text('SELECT filename, status FROM documents'))
        drows = docs.fetchall()
        print('DOCUMENTS:', len(drows))
        for r in drows:
            print(' ', r.filename, r.status)

asyncio.run(check())
