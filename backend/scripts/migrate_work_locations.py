"""Idempotent migration for work_locations table + employees.work_location_id FK."""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine
from sqlalchemy import text

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS work_locations (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    street_address VARCHAR,
    municipality VARCHAR,
    province VARCHAR(10),
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL DEFAULT 'CA',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
"""

CREATE_INDEX = """
CREATE INDEX IF NOT EXISTS ix_work_locations_owner_id ON work_locations(owner_id);
"""

ADD_FK_COLUMN = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employees' AND column_name = 'work_location_id'
    ) THEN
        ALTER TABLE employees
            ADD COLUMN work_location_id UUID REFERENCES work_locations(id) ON DELETE SET NULL;
        CREATE INDEX ix_employees_work_location_id ON employees(work_location_id);
    END IF;
END
$$;
"""

async def main():
    async with engine.begin() as conn:
        print("Creating work_locations table (IF NOT EXISTS)...")
        await conn.execute(text(CREATE_TABLE))
        print("Creating owner_id index (IF NOT EXISTS)...")
        await conn.execute(text(CREATE_INDEX))
        print("Adding employees.work_location_id column (IF NOT EXISTS)...")
        await conn.execute(text(ADD_FK_COLUMN))
    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(main())
