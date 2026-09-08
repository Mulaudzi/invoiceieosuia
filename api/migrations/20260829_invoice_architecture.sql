-- IEOSUIA invoice category/template architecture. Run once per environment.
ALTER TABLE invoices
  ADD COLUMN category VARCHAR(40) NOT NULL DEFAULT 'general' AFTER template_id,
  ADD COLUMN document_type VARCHAR(40) NOT NULL DEFAULT 'standard_invoice' AFTER category,
  ADD COLUMN template_slug VARCHAR(120) NULL AFTER document_type,
  ADD COLUMN template_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER template_slug,
  ADD COLUMN metadata JSON NULL AFTER template_version,
  ADD COLUMN template_snapshot JSON NULL AFTER metadata;

ALTER TABLE invoice_items
  ADD COLUMN sku VARCHAR(100) NULL AFTER product_id,
  ADD COLUMN unit VARCHAR(40) NULL AFTER sku,
  ADD COLUMN group_name VARCHAR(100) NULL AFTER unit,
  ADD COLUMN discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER price,
  ADD COLUMN metadata JSON NULL AFTER discount_rate;

CREATE TABLE IF NOT EXISTS invoice_template_preferences (
  user_id INT(11) NOT NULL PRIMARY KEY,
  last_category VARCHAR(40) NULL,
  last_document_type VARCHAR(40) NULL,
  last_template_slug VARCHAR(120) NULL,
  favourite_templates JSON NULL,
  recent_templates JSON NULL,
  customisations JSON NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
