-- Migration: Create payment_transactions table for PayFast integration
-- This stores payment gateway transaction records

CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan VARCHAR(20) NOT NULL COMMENT 'pro or business',
    amount DECIMAL(10,2) NOT NULL,
    payment_id VARCHAR(100) NULL COMMENT 'PayFast payment ID',
    merchant_payment_id VARCHAR(100) NULL COMMENT 'Our internal reference',
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50) NULL,
    gateway VARCHAR(50) DEFAULT 'payfast',
    gateway_response TEXT NULL COMMENT 'JSON response from gateway',
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payment_transactions_user (user_id),
    INDEX idx_payment_transactions_status (status),
    INDEX idx_payment_transactions_payment_id (payment_id),
    INDEX idx_payment_transactions_merchant_id (merchant_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add logo_path column to users table for business logo
ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_path VARCHAR(255) NULL AFTER avatar;
