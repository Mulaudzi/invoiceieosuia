-- Migration: Rename auth_step column to step for consistency
-- The AuthController uses 'step' while the original table used 'auth_step'

-- Rename the column
ALTER TABLE admin_sessions CHANGE COLUMN auth_step step INT NOT NULL DEFAULT 1;

-- Update index if needed
CREATE INDEX IF NOT EXISTS idx_step ON admin_sessions(step);
