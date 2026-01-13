-- Add Google OAuth support to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL AFTER email;
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_google_id (google_id);

-- Allow nullable password for OAuth users
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;
