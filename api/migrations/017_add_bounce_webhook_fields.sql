-- Add bounce and webhook tracking fields to email_logs
ALTER TABLE email_logs
    ADD COLUMN bounce_type VARCHAR(50) NULL AFTER status,
    ADD COLUMN bounced_at TIMESTAMP NULL AFTER bounce_type,
    ADD COLUMN is_complaint BOOLEAN DEFAULT FALSE AFTER bounced_at,
    ADD COLUMN webhook_data JSON NULL AFTER is_complaint,
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER metadata;

-- Add index for bounce tracking
ALTER TABLE email_logs ADD INDEX idx_bounce_type (bounce_type);
ALTER TABLE email_logs ADD INDEX idx_bounced_at (bounced_at);

-- Create webhook logs table for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    payload JSON NOT NULL,
    ip_address VARCHAR(45),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create admin notification settings table
CREATE TABLE IF NOT EXISTS admin_notification_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_type VARCHAR(50) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    email_recipients TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default notification settings
INSERT INTO admin_notification_settings (notification_type, enabled, email_recipients) VALUES
    ('new_contact_submission', TRUE, 'info@ieosuia.com'),
    ('email_bounce', TRUE, 'info@ieosuia.com'),
    ('daily_summary', FALSE, 'info@ieosuia.com')
ON DUPLICATE KEY UPDATE notification_type = notification_type;
