-- Add last_activity column to admin_sessions for inactivity timeout tracking
ALTER TABLE admin_sessions 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_last_activity ON admin_sessions(last_activity);
