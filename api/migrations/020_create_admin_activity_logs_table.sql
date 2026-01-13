-- Migration: Create admin_activity_logs table for security auditing
-- Run: mysql -u username -p database < 020_create_admin_activity_logs_table.sql

CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NULL,
    admin_email VARCHAR(255) NULL,
    action VARCHAR(100) NOT NULL,
    category ENUM('auth', 'user_management', 'submission', 'settings', 'system') NOT NULL DEFAULT 'system',
    target_type VARCHAR(50) NULL,
    target_id INT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    status ENUM('success', 'failed', 'warning') NOT NULL DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_activity_admin (admin_user_id),
    INDEX idx_admin_activity_action (action),
    INDEX idx_admin_activity_category (category),
    INDEX idx_admin_activity_created (created_at),
    INDEX idx_admin_activity_status (status),
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
