-- Migration 028: Create missing tables (subscription_history, settings)
-- Run this migration to fix schema inconsistencies

-- 1. Create subscription_history table
CREATE TABLE IF NOT EXISTS subscription_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan VARCHAR(50) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    payment_reference VARCHAR(255),
    amount DECIMAL(10,2),
    status ENUM('active', 'cancelled', 'expired', 'pending', 'payment_failed') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_subscription_user (user_id),
    INDEX idx_subscription_status (status)
);

-- 2. Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_group VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settings_group (setting_group)
);

-- 3. Insert default payment retry settings
INSERT IGNORE INTO settings (setting_key, setting_value, setting_group, description) VALUES 
    ('payment_retry_intervals', '1,3,7', 'payment', 'Days between retry attempts (comma-separated)'),
    ('payment_grace_period_days', '7', 'payment', 'Days of grace period after final retry failure'),
    ('payment_max_retries', '3', 'payment', 'Maximum number of payment retry attempts');

-- 4. Add authorization_code to payment_methods if missing
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS authorization_code VARCHAR(255) NULL AFTER token;
