import asyncio
from sqlalchemy import text
from app.db.database import engine

async def run():
    async with engine.begin() as conn:

        # Drop the foreign key constraint first
        await conn.execute(text("""
            ALTER TABLE agent_logs
            DROP CONSTRAINT IF EXISTS agent_logs_document_id_fkey
        """))

        # Drop the foreign key constraint on user_id too
        await conn.execute(text("""
            ALTER TABLE agent_logs
            DROP CONSTRAINT IF EXISTS agent_logs_user_id_fkey
        """))

        # Change document_id column type to UUID
        await conn.execute(text("""
            ALTER TABLE agent_logs
            ALTER COLUMN document_id
            TYPE UUID USING document_id::uuid
        """))

        # Change user_id column type to UUID
        await conn.execute(text("""
            ALTER TABLE agent_logs
            ALTER COLUMN user_id
            TYPE UUID USING user_id::uuid
        """))

        # Re-add the foreign key constraints
        await conn.execute(text("""
            ALTER TABLE agent_logs
            ADD CONSTRAINT agent_logs_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE
        """))

        await conn.execute(text("""
            ALTER TABLE agent_logs
            ADD CONSTRAINT agent_logs_document_id_fkey
            FOREIGN KEY (document_id) REFERENCES documents(id)
            ON DELETE CASCADE
        """))

        print("✅ agent_logs fixed!")

asyncio.run(run())