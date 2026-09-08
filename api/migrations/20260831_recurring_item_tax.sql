ALTER TABLE recurring_invoice_items
    ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER unit_price;
