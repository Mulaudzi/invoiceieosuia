-- Invoice phase 1: link approved central identities without deleting records.
START TRANSACTION;

ALTER TABLE ejetffbz_invoices.users ADD COLUMN IF NOT EXISTS identity_uuid CHAR(36) NULL AFTER id;
CREATE UNIQUE INDEX IF NOT EXISTS users_identity_uuid_unique ON ejetffbz_invoices.users(identity_uuid);
ALTER TABLE ejetffbz_invoices.admin_users ADD COLUMN IF NOT EXISTS identity_uuid CHAR(36) NULL AFTER id;
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_identity_uuid_unique ON ejetffbz_invoices.admin_users(identity_uuid);

UPDATE ejetffbz_invoices.users u
JOIN ejetffbz_auth.customer_accounts ca ON LOWER(ca.email)=LOWER(u.email)
JOIN ejetffbz_auth.customer_app_access caa ON caa.customer_account_id=ca.id AND caa.status='active'
JOIN ejetffbz_auth.applications a ON a.id=caa.application_id AND a.slug='invoice'
SET u.identity_uuid=ca.uuid,u.email_verified_at=COALESCE(u.email_verified_at,ca.email_verified_at),u.status='active',u.updated_at=CURRENT_TIMESTAMP
WHERE LOWER(u.email)<>'vendaboy.lm@gmail.com' AND LOWER(u.email) NOT LIKE '%@ieosuia.com';

-- Preserve excluded rows as inactive owners of historical invoice data.
UPDATE ejetffbz_invoices.users SET identity_uuid=NULL,status='inactive',updated_at=CURRENT_TIMESTAMP
WHERE LOWER(email)='vendaboy.lm@gmail.com' OR LOWER(email) LIKE '%@ieosuia.com';

SET @central_admin_uuid := (SELECT uuid FROM ejetffbz_auth.admin_accounts WHERE LOWER(email)='lufuno@ieosuia.com' AND status='active' LIMIT 1);
UPDATE ejetffbz_invoices.admin_users SET identity_uuid=@central_admin_uuid,email='lufuno@ieosuia.com',name='Lufuno Mulaudzi',status='active',updated_at=CURRENT_TIMESTAMP
WHERE id=1 AND @central_admin_uuid IS NOT NULL;
DELETE FROM ejetffbz_invoices.admin_users WHERE id<>1 AND @central_admin_uuid IS NOT NULL;

COMMIT;

SELECT COUNT(*) AS linked_invoice_customers FROM ejetffbz_invoices.users WHERE identity_uuid IS NOT NULL AND status='active';
SELECT COUNT(*) AS excluded_active_customers FROM ejetffbz_invoices.users WHERE (LOWER(email)='vendaboy.lm@gmail.com' OR LOWER(email) LIKE '%@ieosuia.com') AND (identity_uuid IS NOT NULL OR status<>'inactive');
SELECT (@central_admin_uuid IS NOT NULL) AS central_admin_found;
SELECT COUNT(*) AS linked_invoice_admins FROM ejetffbz_invoices.admin_users WHERE identity_uuid=@central_admin_uuid AND email='lufuno@ieosuia.com' AND status='active';
