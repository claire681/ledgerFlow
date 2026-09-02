-- Add cheque tracking fields to pay_stubs
ALTER TABLE pay_stubs ADD COLUMN IF NOT EXISTS cheque_number VARCHAR(30);
ALTER TABLE pay_stubs ADD COLUMN IF NOT EXISTS cheque_date DATE;
CREATE INDEX IF NOT EXISTS ix_pay_stubs_cheque_number ON pay_stubs (cheque_number);
