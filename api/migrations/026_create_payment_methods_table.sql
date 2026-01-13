-- Create payment_methods table for storing user payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('card', 'bank', 'payfast', 'paystack', 'eft') NOT NULL DEFAULT 'card',
    last_four VARCHAR(4) NOT NULL,
    brand VARCHAR(50) NULL COMMENT 'Visa, Mastercard, etc.',
    expiry_month TINYINT UNSIGNED NULL,
    expiry_year SMALLINT UNSIGNED NULL,
    token VARCHAR(255) NULL COMMENT 'Payment gateway token for recurring charges',
    gateway ENUM('payfast', 'paystack') NOT NULL DEFAULT 'payfast',
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payment_methods_user (user_id),
    INDEX idx_payment_methods_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add invoice_id to payment_transactions if not exists
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() 
     AND table_name = 'payment_transactions' AND column_name = 'invoice_id') > 0,
    'SELECT 1',
    'ALTER TABLE payment_transactions ADD COLUMN invoice_id INT NULL AFTER plan'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
