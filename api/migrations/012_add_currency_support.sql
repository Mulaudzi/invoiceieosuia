-- Migration: Add multi-currency support to invoices and clients

-- Add currency column to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ZAR';

-- Add currency columns to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ZAR';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6) DEFAULT 1.000000;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS base_total DECIMAL(10,2) NULL COMMENT 'Total in base currency (ZAR)';

-- Create exchange rates cache table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    target_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15,6) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pair (base_currency, target_currency),
    INDEX idx_target (target_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create invoice reminders table
CREATE TABLE IF NOT EXISTS invoice_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    user_id INT NOT NULL,
    reminder_type ENUM('before_due', 'on_due', 'after_due') NOT NULL,
    days_offset INT NOT NULL DEFAULT 0 COMMENT 'Days before/after due date',
    scheduled_for DATETIME NOT NULL,
    sent_at DATETIME NULL,
    status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reminders_scheduled (scheduled_for, status),
    INDEX idx_reminders_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add reminder settings to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_settings JSON NULL COMMENT 'JSON object with reminder preferences';

-- Insert default exchange rates
INSERT IGNORE INTO exchange_rates (base_currency, target_currency, rate) VALUES
('ZAR', 'USD', 0.055),
('ZAR', 'EUR', 0.050),
('ZAR', 'GBP', 0.043),
('ZAR', 'AUD', 0.084),
('ZAR', 'CAD', 0.074),
('ZAR', 'INR', 4.59),
('ZAR', 'NGN', 85.0),
('ZAR', 'KES', 8.5),
('ZAR', 'BWP', 0.74),
('ZAR', 'NAD', 1.00),
('USD', 'ZAR', 18.18),
('EUR', 'ZAR', 20.00),
('GBP', 'ZAR', 23.26);
