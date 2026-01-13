-- Add subscription_renewal_date column to users table
-- This tracks when each user's subscription should renew

-- Check and add subscription_renewal_date column
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() 
     AND table_name = 'users' AND column_name = 'subscription_renewal_date') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN subscription_renewal_date DATE NULL AFTER plan'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for efficient cron job queries
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE table_schema = DATABASE() 
     AND table_name = 'users' AND index_name = 'idx_users_renewal_date') > 0,
    'SELECT 1',
    'CREATE INDEX idx_users_renewal_date ON users(subscription_renewal_date)'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Set initial renewal date for existing paid users (1 month from now)
UPDATE users 
SET subscription_renewal_date = DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
WHERE plan IN ('solo', 'pro', 'business', 'enterprise')
AND subscription_renewal_date IS NULL;
