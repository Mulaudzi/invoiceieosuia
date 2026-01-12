-- Migration: Create recurring invoices tables
-- Run: mysql -u username -p database < 013_create_recurring_invoices_table.sql

-- Recurring invoices table
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
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
    INDEX idx_recurring_user (user_id),
    INDEX idx_recurring_client (client_id),
    INDEX idx_recurring_status (status),
    INDEX idx_recurring_next_date (next_invoice_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recurring invoice items table
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
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_recurring_items_invoice (recurring_invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add recurring_invoice_id to invoices to track generated invoices
ALTER TABLE invoices ADD COLUMN recurring_invoice_id INT NULL AFTER template_id;
ALTER TABLE invoices ADD FOREIGN KEY (recurring_invoice_id) REFERENCES recurring_invoices(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD INDEX idx_invoices_recurring (recurring_invoice_id);