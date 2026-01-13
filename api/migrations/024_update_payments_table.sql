-- Migration: Update payments table for gateway integration
-- Add new payment methods and reference tracking

-- Modify the method column to allow more payment types
ALTER TABLE payments MODIFY COLUMN method VARCHAR(50) NOT NULL;

-- Add gateway tracking columns if they don't exist
ALTER TABLE payments 
    ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) NULL COMMENT 'Payment gateway used (paystack, payfast, manual)',
    ADD COLUMN IF NOT EXISTS gateway_transaction_id VARCHAR(100) NULL COMMENT 'Transaction ID from payment gateway',
    ADD INDEX IF NOT EXISTS idx_payments_reference (reference),
    ADD INDEX IF NOT EXISTS idx_payments_gateway (gateway);

-- Update payment_transactions table to support invoice payments
ALTER TABLE payment_transactions 
    MODIFY COLUMN plan VARCHAR(50) NOT NULL COMMENT 'pro, business, or invoice',
    ADD COLUMN IF NOT EXISTS invoice_id INT NULL AFTER plan,
    ADD INDEX IF NOT EXISTS idx_payment_transactions_invoice (invoice_id);
