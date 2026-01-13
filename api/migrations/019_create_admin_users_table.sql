-- Migration: Create admin_users table with multi-step authentication
-- Run: mysql -u username -p database < 019_create_admin_users_table.sql

-- Admin users table with hashed passwords for multi-step login
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_1 VARCHAR(255) NOT NULL,  -- Argon2ID hashed
    password_2 VARCHAR(255) NOT NULL,  -- Argon2ID hashed
    password_3 VARCHAR(255) NOT NULL,  -- Argon2ID hashed
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_email (email),
    INDEX idx_admin_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add admin_user_id column to admin_sessions if not exists
-- Note: The column is added after auth_step (the original column name)
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS admin_user_id INT NULL AFTER step;
ALTER TABLE admin_sessions ADD FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL;

-- Note: After running this migration, use the /admin-setup page to create the first admin user
