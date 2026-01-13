-- Migration: Fix all missing tables and dependencies
-- Run this migration to ensure all required tables exist

-- 1. Exchange rates table (for currency conversion)
CREATE TABLE IF NOT EXISTS exchange_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    target_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15,6) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pair (base_currency, target_currency),
    INDEX idx_target (target_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- 2. Invoice reminders table
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

-- 3. Recurring invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT NOT NULL,
    template_id INT,
    description VARCHAR(255) NOT NULL,
    frequency ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NULL,
    next_invoice_date DATE NOT NULL,
    last_generated_at TIMESTAMP NULL,
    total_generated INT DEFAULT 0,
    subtotal DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    terms TEXT,
    status ENUM('active', 'paused', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_recurring_user (user_id),
    INDEX idx_recurring_client (client_id),
    INDEX idx_recurring_status (status),
    INDEX idx_recurring_next_date (next_invoice_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Recurring invoice items table
CREATE TABLE IF NOT EXISTS recurring_invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recurring_invoice_id INT NOT NULL,
    product_id INT,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recurring_invoice_id) REFERENCES recurring_invoices(id) ON DELETE CASCADE,
    INDEX idx_recurring_items_invoice (recurring_invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('email', 'sms') NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    invoice_id INT,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT,
    credits_used INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_user (user_id),
    INDEX idx_notification_type (type),
    INDEX idx_notification_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Plan limits reference table
CREATE TABLE IF NOT EXISTS plan_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(50) NOT NULL UNIQUE,
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    email_credits_monthly INT NOT NULL DEFAULT 0,
    sms_credits_monthly INT NOT NULL DEFAULT 0,
    invoices_monthly INT DEFAULT NULL,
    custom_branding BOOLEAN DEFAULT FALSE,
    custom_templates BOOLEAN DEFAULT FALSE,
    auto_reminders BOOLEAN DEFAULT FALSE,
    advanced_reports BOOLEAN DEFAULT FALSE,
    multi_user INT DEFAULT 1,
    white_label BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default plan limits
INSERT IGNORE INTO plan_limits (plan_name, monthly_price, email_credits_monthly, sms_credits_monthly, invoices_monthly, custom_branding, custom_templates, auto_reminders, advanced_reports, multi_user, white_label, priority_support) VALUES
('free', 0, 20, 0, 30, FALSE, FALSE, FALSE, FALSE, 1, FALSE, FALSE),
('solo', 149, 50, 10, NULL, TRUE, TRUE, FALSE, FALSE, 1, FALSE, FALSE),
('pro', 299, 100, 25, NULL, TRUE, TRUE, TRUE, TRUE, 1, FALSE, TRUE),
('business', 599, 200, 50, NULL, TRUE, TRUE, TRUE, TRUE, 10, TRUE, TRUE),
('enterprise', 0, 999999, 999999, NULL, TRUE, TRUE, TRUE, TRUE, 999, TRUE, TRUE);

-- 7. Notifications table (user notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    message VARCHAR(500) NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_type VARCHAR(50) NULL COMMENT 'invoice, client, payment, etc.',
    related_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_notifications (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Add missing columns to users table (safe - uses IF NOT EXISTS equivalent)
-- Using ALTER IGNORE or checking if column exists

-- Check and add plan column
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() 
     AND table_name = 'users' AND column_name = 'plan') > 0,
    'SELECT 1',
    "ALTER TABLE users ADD COLUMN plan ENUM('free', 'solo', 'pro', 'business', 'enterprise') DEFAULT 'free'"
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add email_credits column
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() 
     AND table_name = 'users' AND column_name = 'email_credits') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN email_credits INT DEFAULT 20'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add email_credits_used column
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() 
     AND table_name = 'users' AND column_name = 'email_credits_used') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN email_credits_used INT DEFAULT 0'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add sms_credits column
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() 
     AND table_name = 'users' AND column_name = 'sms_credits') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN sms_credits INT DEFAULT 0'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add sms_credits_used column
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() 
     AND table_name = 'users' AND column_name = 'sms_credits_used') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN sms_credits_used INT DEFAULT 0'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add credits_reset_at column
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() 
     AND table_name = 'users' AND column_name = 'credits_reset_at') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN credits_reset_at DATE DEFAULT (CURRENT_DATE)'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add reminder_settings column
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() 
     AND table_name = 'users' AND column_name = 'reminder_settings') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN reminder_settings JSON NULL'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
