# IEOSUIA Invoicing API

Laravel-based REST API for the IEOSUIA Invoicing System.

## Requirements

- PHP 8.2+
- Composer
- MySQL 8.0+
- Node.js (for frontend)

## Installation

1. Navigate to the API directory:
```bash
cd api
```

2. Install dependencies:
```bash
composer install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Generate application key:
```bash
php artisan key:generate
```

5. Configure your database in `.env`:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ieosuia_invoices
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

6. Run migrations:
```bash
php artisan migrate
```

7. (Optional) Seed demo data:
```bash
php artisan db:seed
```

## Development

Start the development server:
```bash
php artisan serve --port=8000
```

API will be available at `http://localhost:8000/api`

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout (requires auth)
- `GET /api/user` - Get current user (requires auth)
- `PUT /api/user/profile` - Update profile (requires auth)
- `PUT /api/user/plan` - Update plan (requires auth)

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/{id}` - Get client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/{id}` - Get product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product
- `GET /api/products/categories` - Get unique categories

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/{id}` - Get invoice
- `PUT /api/invoices/{id}` - Update invoice
- `DELETE /api/invoices/{id}` - Delete invoice
- `GET /api/invoices/{id}/pdf` - Download PDF
- `POST /api/invoices/{id}/send` - Send to client
- `POST /api/invoices/{id}/mark-paid` - Mark as paid

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create template
- `GET /api/templates/{id}` - Get template
- `PUT /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Delete template
- `POST /api/templates/{id}/default` - Set as default

### Payments
- `GET /api/payments` - List all payments
- `POST /api/payments` - Record payment
- `GET /api/payments/{id}` - Get payment
- `DELETE /api/payments/{id}` - Delete payment
- `GET /api/payments/summary` - Get payment summary

### Reports
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/monthly-revenue` - Monthly revenue chart
- `GET /api/reports/invoice-status` - Invoice status breakdown
- `GET /api/reports/top-clients` - Top clients by revenue
- `GET /api/reports/income-expense` - Income vs expense
- `GET /api/reports/recent-invoices` - Recent invoices

## Plan Limits

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Invoices/month | 30 | Unlimited | Unlimited |
| Templates | 3 | 10 | Unlimited |
| IEOSUIA branding | Yes | Removable | Removable |
| Automated reminders | No | Yes | Yes |
| Multi-user | No | No | Yes |
| API access | No | No | Yes |

## Production Deployment

1. Set `APP_ENV=production` and `APP_DEBUG=false`
2. Configure MySQL database
3. Run `php artisan config:cache`
4. Run `php artisan route:cache`
5. Set up SSL certificate
6. Configure web server (Nginx/Apache)

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name invoices.ieosuia.com;
    root /var/www/invoiceieosuia/dist;
    index index.html;

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to PHP
    location /api {
        alias /var/www/invoiceieosuia/api/public;
        try_files $uri $uri/ @api;
        
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    @api {
        rewrite ^/api/(.*)$ /api/index.php?/$1 last;
    }
}
```

## License

Proprietary - IEOSUIA (Pty) Ltd
