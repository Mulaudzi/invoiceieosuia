ALTER TABLE admin_users ADD COLUMN pin_hash VARCHAR(255) NULL AFTER password_3;

UPDATE admin_users
SET pin_hash = '$2y$12$yDxmmzHP0zmTTfotOgXjJ.8tL27YtGtoMiK.32zAxRFoundtHD/Fq'
WHERE pin_hash IS NULL OR pin_hash = '';
