-- Blocked email domains table for disposable and role-based email detection
CREATE TABLE IF NOT EXISTS blocked_email_domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('disposable', 'role') DEFAULT 'disposable',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_blocked_domains_type (type)
);

-- Initial role-based patterns (local part prefixes)
INSERT IGNORE INTO blocked_email_domains (domain, type) VALUES
('admin', 'role'),
('info', 'role'),
('support', 'role'),
('sales', 'role'),
('contact', 'role'),
('webmaster', 'role'),
('postmaster', 'role'),
('hostmaster', 'role'),
('noreply', 'role'),
('no-reply', 'role');
