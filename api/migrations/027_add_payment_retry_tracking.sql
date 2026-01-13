-- Migration: Add payment retry tracking and grace period support
-- Enables automatic retry of failed payments with notification scheduling

-- Add retry tracking columns to payment_transactions table
ALTER TABLE payment_transactions 
    ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0 COMMENT 'Number of retry attempts',
    ADD COLUMN IF NOT EXISTS max_retries INT DEFAULT 3 COMMENT 'Maximum retry attempts allowed',
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP NULL COMMENT 'When to attempt next retry',
    ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP NULL COMMENT 'When last retry was attempted',
    ADD COLUMN IF NOT EXISTS failure_reason TEXT NULL COMMENT 'Last failure reason',
    ADD INDEX IF NOT EXISTS idx_payment_transactions_retry (status, next_retry_at);

-- Add grace period columns to users table
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS subscription_grace_until DATE NULL COMMENT 'Grace period end date',
    ADD COLUMN IF NOT EXISTS payment_failure_count INT DEFAULT 0 COMMENT 'Consecutive payment failure count',
    ADD COLUMN IF NOT EXISTS last_payment_failure_at TIMESTAMP NULL COMMENT 'Last payment failure timestamp',
    ADD INDEX IF NOT EXISTS idx_users_grace (subscription_grace_until);

-- Create failed payment notifications log table
CREATE TABLE IF NOT EXISTS payment_retry_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transaction_id INT NULL,
    notification_type ENUM('first_failure', 'retry_scheduled', 'retry_failed', 'final_failure', 'grace_warning', 'grace_ending') NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_retry_notifications_user (user_id),
    INDEX idx_retry_notifications_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert grace period configuration into settings if it doesn't exist
INSERT IGNORE INTO settings (setting_key, setting_value, setting_group, description)
VALUES 
    ('payment_retry_intervals', '1,3,7', 'payment', 'Days between retry attempts (comma-separated)'),
    ('payment_grace_period_days', '7', 'payment', 'Days of grace period after final retry failure'),
    ('payment_max_retries', '3', 'payment', 'Maximum number of payment retry attempts');
