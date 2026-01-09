# Database Migrations

## Quick Setup (All Tables)

Run the complete migration in one command:

```bash
mysql -u ejetffbz_ieosuia -p ejetffbz_invoices < run_all.sql
```

Then enter password: `I Am Ieosuia`

## Individual Migrations

Run migrations in order:

```bash
mysql -u ejetffbz_ieosuia -p ejetffbz_invoices < 001_create_users_table.sql
mysql -u ejetffbz_ieosuia -p ejetffbz_invoices < 002_create_auth_tables.sql
mysql -u ejetffbz_ieosuia -p ejetffbz_invoices < 003_create_clients_table.sql
mysql -u ejetffbz_ieosuia -p ejetffbz_invoices < 004_create_products_table.sql
mysql -u ejetffbz_ieosuia -p ejetffbz_invoices < 005_create_templates_table.sql
mysql -u ejetffbz_ieosuia -p ejetffbz_invoices < 006_create_invoices_table.sql
mysql -u ejetffbz_ieosuia -p ejetffbz_invoices < 007_create_invoice_items_table.sql
mysql -u ejetffbz_ieosuia -p ejetffbz_invoices < 008_create_payments_table.sql
```

## Seed Test Data

After running migrations, seed the test user:

```bash
cd /path/to/api
php seed.php
```

Test user credentials:
- **Email:** test@ieosuia.com
- **Password:** 123456789

## Migration Order

| Order | File | Description |
|-------|------|-------------|
| 001 | create_users_table | Core users table |
| 002 | create_auth_tables | Email verification, password resets, API tokens, rate limits |
| 003 | create_clients_table | Customer/client records |
| 004 | create_products_table | Products/services catalog |
| 005 | create_templates_table | Invoice templates |
| 006 | create_invoices_table | Invoice headers |
| 007 | create_invoice_items_table | Invoice line items |
| 008 | create_payments_table | Payment records |
