-- Add avatar column to users table
ALTER TABLE users ADD COLUMN avatar VARCHAR(500) NULL AFTER tax_number;
