import asyncio
from sqlalchemy import text
from app.db.database import engine

async def run():
    async with engine.begin() as conn:

        print("Fixing agent_logs table...")

        # Drop all constraints on agent_logs first
        await conn.execute(text("""
            ALTER TABLE agent_logs
            DROP CONSTRAINT IF EXISTS agent_logs_document_id_fkey
        """))
        await conn.execute(text("""
            ALTER TABLE agent_logs
            DROP CONSTRAINT IF EXISTS agent_logs_user_id_fkey
        """))

        # Clear any bad data that cannot be cast to UUID
        await conn.execute(text("""
            DELETE FROM agent_logs
            WHERE document_id IS NOT NULL
            AND document_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        """))
        await conn.execute(text("""
            DELETE FROM agent_logs
            WHERE user_id IS NOT NULL
            AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        """))

        # Add new UUID columns
        await conn.execute(text("""
            ALTER TABLE agent_logs
            ADD COLUMN IF NOT EXISTS user_id_new UUID
        """))
        await conn.execute(text("""
            ALTER TABLE agent_logs
            ADD COLUMN IF NOT EXISTS document_id_new UUID
        """))

        # Copy data to new columns
        await conn.execute(text("""
            UPDATE agent_logs
            SET user_id_new = user_id::uuid
            WHERE user_id IS NOT NULL
        """))
        await conn.execute(text("""
            UPDATE agent_logs
            SET document_id_new = document_id::uuid
            WHERE document_id IS NOT NULL
        """))

        # Drop old columns
        await conn.execute(text("""
            ALTER TABLE agent_logs DROP COLUMN IF EXISTS user_id
        """))
        await conn.execute(text("""
            ALTER TABLE agent_logs DROP COLUMN IF EXISTS document_id
        """))

        # Rename new columns
        await conn.execute(text("""
            ALTER TABLE agent_logs
            RENAME COLUMN user_id_new TO user_id
        """))
        await conn.execute(text("""
            ALTER TABLE agent_logs
            RENAME COLUMN document_id_new TO document_id
        """))

        # Add NOT NULL to user_id
        await conn.execute(text("""
            ALTER TABLE agent_logs
            ALTER COLUMN user_id SET NOT NULL
        """))

        # Re-add foreign key constraints
        await conn.execute(text("""
            ALTER TABLE agent_logs
            ADD CONSTRAINT agent_logs_user_id_fkey
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
        """))
        await conn.execute(text("""
            ALTER TABLE agent_logs
            ADD CONSTRAINT agent_logs_document_id_fkey
            FOREIGN KEY (document_id)
            REFERENCES documents(id)
            ON DELETE CASCADE
        """))

        print("✅ agent_logs fixed!")

        # Also fix transactions table
        print("Fixing transactions table...")

        await conn.execute(text("""
            ALTER TABLE transactions
            DROP CONSTRAINT IF EXISTS transactions_document_id_fkey
        """))
        await conn.execute(text("""
            ALTER TABLE transactions
            DROP CONSTRAINT IF EXISTS transactions_user_id_fkey
        """))

        await conn.execute(text("""
            DELETE FROM transactions
            WHERE document_id IS NOT NULL
            AND document_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        """))

        await conn.execute(text("""
            ALTER TABLE transactions
            ADD COLUMN IF NOT EXISTS document_id_new UUID
        """))
        await conn.execute(text("""
            UPDATE transactions
            SET document_id_new = document_id::uuid
            WHERE document_id IS NOT NULL
        """))
        await conn.execute(text("""
            ALTER TABLE transactions DROP COLUMN IF EXISTS document_id
        """))
        await conn.execute(text("""
            ALTER TABLE transactions
            RENAME COLUMN document_id_new TO document_id
        """))
        await conn.execute(text("""
            ALTER TABLE transactions
            ADD CONSTRAINT transactions_document_id_fkey
            FOREIGN KEY (document_id)
            REFERENCES documents(id)
            ON DELETE CASCADE
        """))

        print("✅ transactions fixed!")
        print("✅ All UUID mismatches resolved!")

asyncio.run(run())