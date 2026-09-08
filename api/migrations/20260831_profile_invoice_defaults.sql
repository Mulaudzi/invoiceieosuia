ALTER TABLE users
    ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100) NULL AFTER tax_number,
    ADD COLUMN IF NOT EXISTS website VARCHAR(255) NULL AFTER registration_number,
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150) NULL AFTER website,
    ADD COLUMN IF NOT EXISTS account_name VARCHAR(150) NULL AFTER bank_name,
    ADD COLUMN IF NOT EXISTS account_number VARCHAR(100) NULL AFTER account_name,
    ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50) NULL AFTER account_number,
    ADD COLUMN IF NOT EXISTS swift_code VARCHAR(50) NULL AFTER branch_code,
    ADD COLUMN IF NOT EXISTS payment_instructions TEXT NULL AFTER swift_code;
