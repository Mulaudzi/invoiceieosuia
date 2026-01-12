-- Migration: Add notification credits tracking
-- Run: mysql -u username -p database < 014_add_notification_credits.sql

-- Add credit columns to users table
ALTER TABLE users 
ADD COLUMN plan ENUM('free', 'solo', 'pro', 'business', 'enterprise') DEFAULT 'free' AFTER email_verified,
ADD COLUMN email_credits INT DEFAULT 20 AFTER plan,
ADD COLUMN email_credits_used INT DEFAULT 0 AFTER email_credits,
ADD COLUMN sms_credits INT DEFAULT 0 AFTER email_credits_used,
ADD COLUMN sms_credits_used INT DEFAULT 0 AFTER sms_credits,
ADD COLUMN credits_reset_at DATE DEFAULT (CURRENT_DATE) AFTER sms_credits_used;

-- Create notification usage log table
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
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    INDEX idx_notification_user (user_id),
    INDEX idx_notification_type (type),
    INDEX idx_notification_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create plan limits reference table
CREATE TABLE IF NOT EXISTS plan_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(50) NOT NULL UNIQUE,
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    email_credits_monthly INT NOT NULL DEFAULT 0,
    sms_credits_monthly INT NOT NULL DEFAULT 0,
    invoices_monthly INT DEFAULT NULL, -- NULL = unlimited
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
INSERT INTO plan_limits (plan_name, monthly_price, email_credits_monthly, sms_credits_monthly, invoices_monthly, custom_branding, custom_templates, auto_reminders, advanced_reports, multi_user, white_label, priority_support) VALUES
('free', 0, 20, 0, 30, FALSE, FALSE, FALSE, FALSE, 1, FALSE, FALSE),
('solo', 149, 50, 10, NULL, TRUE, TRUE, FALSE, FALSE, 1, FALSE, FALSE),
('pro', 299, 100, 25, NULL, TRUE, TRUE, TRUE, TRUE, 1, FALSE, TRUE),
('business', 599, 200, 50, NULL, TRUE, TRUE, TRUE, TRUE, 10, TRUE, TRUE),
('enterprise', 0, 999999, 999999, NULL, TRUE, TRUE, TRUE, TRUE, 999, TRUE, TRUE);

-- Create subscription history table
CREATE TABLE IF NOT EXISTS subscription_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan VARCHAR(50) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    payment_reference VARCHAR(255),
    amount DECIMAL(10,2),
    status ENUM('active', 'cancelled', 'expired', 'pending') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_subscription_user (user_id),
    INDEX idx_subscription_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;