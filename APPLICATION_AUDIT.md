# IEOSUIA Invoices - Complete Application Audit

**Generated:** 2026-01-14  
**Purpose:** Full frontend → backend → database mapping for debugging and production readiness

---

## 1️⃣ High-Level Application Overview

### Application Purpose
IEOSUIA Invoices is a multi-tenant invoicing SaaS platform for South African businesses, featuring:
- Invoice creation, management, and PDF generation
- Client and product management
- Payment tracking and reminders
- Recurring invoices
- Multi-currency support (ZAR primary)
- POPIA compliance

### Frontend Framework & Structure
- **Framework:** React 18.3.1 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Routing:** react-router-dom v6
- **State Management:** React Query + Context API
- **HTTP Client:** Axios with interceptors

### Backend Framework & Structure
- **Language:** PHP (vanilla, MVC pattern)
- **Entry Point:** `api/index.php` (custom router)
- **Controllers:** `api/controllers/`
- **Models:** `api/models/`
- **Middleware:** `api/middleware/`

### Authentication Mechanism
- **Type:** JWT-like token-based auth
- **Token Storage:** `api_tokens` table (hashed with SHA-256)
- **Token Expiry:** 30 days
- **Google OAuth:** Supported via GoogleAuthController
- **Admin Auth:** 3-step password authentication

### Database Type & Schema Overview
- **Type:** MySQL
- **Core Tables:** users, clients, products, invoices, invoice_items, payments
- **Auth Tables:** api_tokens, admin_sessions, admin_login_attempts
- **Notification Tables:** reminders, notification_logs, user_notifications
- **Billing Tables:** subscriptions, payment_history, credits_usage

### API Communication Pattern
- RESTful JSON API
- Base URL: `{domain}/api/`
- Authorization: `Bearer {token}` header
- Error responses: `{ "error": "message" }` with HTTP status codes

---

## 2️⃣ Full Frontend → Backend → Database Map

---

### AUTHENTICATION

#### User Login (Email/Password)

* **Frontend Page / Component**
  * File: `src/pages/Login.tsx`
  * User action: Submit login form

* **Frontend API Call**
  * Function: `authService.login(email, password, recaptchaToken)`
  * File: `src/services/api.ts` (lines 92-106)
  * Endpoint: `POST /api/login`
  * Payload: `{ email, password, recaptcha_token }`

* **Backend Route**
  * Path: `POST /login`
  * File: `api/index.php` (line 75)
  * Middleware: None (public)

* **Backend Controller**
  * File: `api/controllers/AuthController.php`
  * Method: `login()`
  * Lines: ~195-251

* **Business Logic Summary**
  * Validates email/password required
  * Executes reCAPTCHA verification
  * Checks rate limiting per email
  * Verifies password with `password_verify()`
  * Generates API token on success

* **Database Interaction**
  * Tables: `users`, `api_tokens`, `rate_limits`
  * Operations: SELECT (user), INSERT (token)

* **Response Contract**
  * Success: `{ "user": {...}, "token": "..." }` (200)
  * Error: `{ "error": "Invalid credentials" }` (401)
  * Error: `{ "error": "Too many attempts" }` (429)

* **Authorization Requirements**
  * Guest (public endpoint)

* **CRUD Coverage**
  * Create: ✅ (token)
  * Read: ✅ (user)
  * Update: ❌
  * Delete: ❌

* **Functional Status:** ✅ Fully implemented

* **Potential Failure Points**
  * Rate limit table not existing
  * Argon2 not supported on server

---

#### User Registration

* **Frontend Page / Component**
  * File: `src/pages/Register.tsx`
  * User action: Submit registration form

* **Frontend API Call**
  * Function: `authService.register(name, email, password, plan, recaptchaToken)`
  * Endpoint: `POST /api/register`
  * Payload: `{ name, email, password, plan, recaptcha_token }`

* **Backend Route**
  * Path: `POST /register`
  * File: `api/index.php` (line 74)
  * Middleware: None (public)

* **Backend Controller**
  * File: `api/controllers/AuthController.php`
  * Method: `register()`
  * Lines: ~4-73

* **Business Logic Summary**
  * Validates all required fields
  * Validates email format and blocks disposable domains
  * Validates password strength (8+ chars, uppercase, lowercase, number)
  * Hashes password with Argon2ID
  * Creates user record
  * Sends verification email

* **Database Interaction**
  * Tables: `users`, `api_tokens`, `email_verification_tokens`
  * Operations: SELECT (check existing), INSERT (user, token)

* **Response Contract**
  * Success: `{ "user": {...}, "token": "..." }` (201)
  * Error: `{ "error": "Email already registered" }` (422)
  * Error: `{ "error": "Password too weak" }` (422)

* **Authorization Requirements**
  * Guest (public endpoint)

* **CRUD Coverage**
  * Create: ✅
  * Read: ❌
  * Update: ❌
  * Delete: ❌

* **Functional Status:** ✅ Fully implemented

* **Potential Failure Points**
  * Email sending failure (user created but no verification email)
  * Disposable domain list outdated

---

#### Google OAuth Login

* **Frontend Page / Component**
  * File: `src/pages/Login.tsx` (initiate)
  * File: `src/pages/GoogleCallback.tsx` (callback)
  * User action: Click "Continue with Google"

* **Frontend API Call**
  * Step 1: `authService.getGoogleAuthUrl()` → `GET /api/auth/google`
  * Step 2: `authService.googleCallback(code)` → `POST /api/auth/google/callback`

* **Backend Routes**
  * `GET /auth/google` → `GoogleAuthController::getAuthUrl()`
  * `POST /auth/google/callback` → `GoogleAuthController::callback()`

* **Backend Controller**
  * File: `api/controllers/GoogleAuthController.php`

* **Business Logic Summary**
  * Generates Google OAuth URL with scopes
  * Exchanges authorization code for access token
  * Fetches user profile from Google
  * Creates or finds existing user by email
  * Generates API token

* **Database Interaction**
  * Tables: `users`, `api_tokens`
  * Operations: SELECT (find by email), INSERT/UPDATE (user), INSERT (token)

* **Response Contract**
  * Success: `{ "user": {...}, "token": "..." }` (200)
  * Error: `{ "error": "Google authentication failed" }` (401)

* **Authorization Requirements**
  * Guest (public endpoint)

* **CRUD Coverage**
  * Create: ✅ (user if new)
  * Read: ✅
  * Update: ✅ (google_id if existing)
  * Delete: ❌

* **Functional Status:** ✅ Fully implemented

* **Potential Failure Points**
  * Missing GOOGLE_CLIENT_ID/SECRET env vars
  * Incorrect redirect URI configuration
  * Google API rate limits

---

#### Logout

* **Frontend Page / Component**
  * File: `src/components/dashboard/DashboardHeader.tsx`
  * User action: Click logout button

* **Frontend API Call**
  * Function: `authService.logout()`
  * Endpoint: `POST /api/logout`
  * Payload: None (uses Bearer token)

* **Backend Route**
  * Path: `POST /logout`
  * Middleware: `AuthMiddleware`

* **Backend Controller**
  * File: `api/controllers/AuthController.php`
  * Method: `logout()`

* **Database Interaction**
  * Tables: `api_tokens`
  * Operations: DELETE (current token)

* **Response Contract**
  * Success: `{ "message": "Logged out" }` (200)

* **Functional Status:** ✅ Fully implemented

---

#### Get Current User

* **Frontend API Call**
  * Function: `authService.getCurrentUser()`
  * Endpoint: `GET /api/user`

* **Backend Route**
  * Path: `GET /user`
  * Middleware: `AuthMiddleware`

* **Backend Controller**
  * Method: `AuthController::user()`

* **Response Contract**
  * Success: `{ "id", "name", "email", "plan", "businessName", ... }` (200)
  * Error: `{ "error": "Unauthorized" }` (401)

* **Functional Status:** ✅ Fully implemented

---

### CLIENTS

#### List Clients

* **Frontend Page / Component**
  * File: `src/pages/Clients.tsx`
  * Hook: `useClients()` from `src/hooks/useClients.ts`
  * User action: Page load

* **Frontend API Call**
  * Function: `clientService.getAll()`
  * Endpoint: `GET /api/clients`

* **Backend Route**
  * Path: `GET /clients`
  * Middleware: `AuthMiddleware`

* **Backend Controller**
  * File: `api/controllers/ClientController.php`
  * Method: `index()`

* **Database Interaction**
  * Tables: `clients`
  * Operations: SELECT WHERE user_id = current_user

* **Response Contract**
  * Success: `[{ "id", "name", "email", "company", ... }, ...]` (200)

* **CRUD Coverage**
  * Create: ✅ (via store)
  * Read: ✅
  * Update: ✅ (via update)
  * Delete: ✅ (via destroy)

* **Functional Status:** ✅ Fully implemented

---

#### Create Client

* **Frontend Component**
  * File: `src/components/clients/ClientModal.tsx`
  * User action: Submit form

* **Frontend API Call**
  * Function: `clientService.create(data)`
  * Endpoint: `POST /api/clients`
  * Payload: `{ name, email, company, phone, address, tax_number, group_id }`

* **Backend Controller**
  * Method: `ClientController::store()`

* **Database Interaction**
  * Tables: `clients`
  * Operations: INSERT

* **Response Contract**
  * Success: `{ "id", "name", ... }` (201)
  * Error: `{ "error": "Name and email are required" }` (422)

* **Functional Status:** ✅ Fully implemented

---

#### Update Client

* **Frontend API Call**
  * Function: `clientService.update(id, data)`
  * Endpoint: `PUT /api/clients/{id}`

* **Backend Controller**
  * Method: `ClientController::update()`

* **Database Interaction**
  * Tables: `clients`
  * Operations: SELECT (verify ownership), UPDATE

* **Response Contract**
  * Success: `{ "id", "name", ... }` (200)
  * Error: `{ "error": "Client not found" }` (404)

* **Functional Status:** ✅ Fully implemented

---

#### Delete Client

* **Frontend Component**
  * File: `src/components/clients/DeleteClientDialog.tsx`

* **Frontend API Call**
  * Function: `clientService.delete(id)`
  * Endpoint: `DELETE /api/clients/{id}`

* **Backend Controller**
  * Method: `ClientController::destroy()`

* **Database Interaction**
  * Tables: `clients`
  * Operations: DELETE

* **Response Contract**
  * Success: `{ "message": "Client deleted" }` (200)
  * Error: `{ "error": "Client not found" }` (404)

* **Functional Status:** ✅ Fully implemented

---

### PRODUCTS

#### List Products

* **Frontend Page**
  * File: `src/pages/Products.tsx`
  * Hook: `useProducts()`

* **Frontend API Call**
  * Endpoint: `GET /api/products`

* **Backend Controller**
  * File: `api/controllers/ProductController.php`
  * Method: `index()`

* **CRUD Coverage:** ✅ Full CRUD implemented

* **Functional Status:** ✅ Fully implemented

---

#### Create/Update/Delete Product

* **Frontend Component:** `src/components/products/ProductModal.tsx`
* **Delete Dialog:** `src/components/products/DeleteProductDialog.tsx`
* **Endpoints:** 
  * `POST /api/products`
  * `PUT /api/products/{id}`
  * `DELETE /api/products/{id}`

* **Controller:** `ProductController.php`

* **Functional Status:** ✅ Fully implemented

---

### INVOICES

#### List Invoices

* **Frontend Page**
  * File: `src/pages/Invoices.tsx`
  * Hook: `useInvoices()`

* **Frontend API Call**
  * Endpoint: `GET /api/invoices`

* **Backend Controller**
  * File: `api/controllers/InvoiceController.php`
  * Method: `index()`

* **Database Interaction**
  * Tables: `invoices`, `invoice_items`, `clients`
  * Operations: SELECT with JOINs

* **Response:** Array of invoices with client info

* **Functional Status:** ✅ Fully implemented

---

#### Create Invoice

* **Frontend Component**
  * File: `src/components/invoices/InvoiceModal.tsx`
  * User action: Submit form

* **Frontend API Call**
  * Function: `invoiceService.create(data)`
  * Endpoint: `POST /api/invoices`
  * Payload: 
    ```json
    {
      "client_id": "123",
      "template_id": "456",
      "invoice_number": "INV-001",
      "issue_date": "2026-01-14",
      "due_date": "2026-01-28",
      "currency": "ZAR",
      "items": [{ "description", "quantity", "price", "tax_rate" }],
      "notes": "...",
      "payment_terms": "..."
    }
    ```

* **Backend Controller**
  * Method: `InvoiceController::store()`

* **Business Logic**
  * Validates client exists and belongs to user
  * Calculates subtotal, tax, total
  * Creates invoice and invoice_items in transaction

* **Database Interaction**
  * Tables: `invoices`, `invoice_items`
  * Operations: INSERT (both tables)
  * Transaction: Yes

* **Response Contract**
  * Success: `{ "id", "invoice_number", ... }` (201)
  * Error: `{ "error": "Client not found" }` (404)

* **Functional Status:** ✅ Fully implemented

* **Potential Failure Points**
  * SelectItem value type mismatch (fixed - now uses String())

---

#### Update Invoice

* **Endpoint:** `PUT /api/invoices/{id}`
* **Controller:** `InvoiceController::update()`
* **Database:** UPDATE invoice, DELETE/INSERT items

* **Functional Status:** ✅ Fully implemented

---

#### Delete Invoice

* **Frontend Component:** `src/components/invoices/DeleteInvoiceDialog.tsx`
* **Endpoint:** `DELETE /api/invoices/{id}`
* **Controller:** `InvoiceController::destroy()`
* **Database:** DELETE invoice (CASCADE deletes items)

* **Functional Status:** ✅ Fully implemented

---

#### Download Invoice PDF

* **Frontend API Call**
  * Function: `invoiceService.downloadPdf(id)`
  * Endpoint: `GET /api/invoices/{id}/pdf/download`

* **Backend Controller**
  * File: `api/controllers/PdfController.php`
  * Method: `download()`

* **Business Logic**
  * Fetches invoice with items and client
  * Uses FPDF library for PDF generation
  * Applies invoice template styling

* **Response:** Binary PDF file

* **Functional Status:** ✅ Fully implemented

---

#### Send Invoice Email

* **Frontend Component**
  * File: `src/components/invoices/SendEmailDialog.tsx`

* **Frontend API Call**
  * Endpoint: `POST /api/invoices/{id}/send`
  * Payload: `{ subject, message }`

* **Backend Controller**
  * File: `api/controllers/NotificationController.php`
  * Method: `sendEmail()`

* **Business Logic**
  * Uses credits system (deducts credit)
  * Sends email via PHPMailer
  * Logs to notification_logs

* **Database Interaction**
  * Tables: `invoices`, `clients`, `credits_usage`, `notification_logs`

* **Functional Status:** ✅ Fully implemented

---

#### Send Invoice SMS

* **Frontend Component:** `src/components/invoices/SendSmsDialog.tsx`
* **Endpoint:** `POST /api/invoices/{id}/send-sms`
* **Controller:** `NotificationController::sendSms()`

* **Functional Status:** ✅ Fully implemented

---

#### Mark Invoice as Paid

* **Endpoint:** `POST /api/invoices/{id}/mark-paid`
* **Controller:** `InvoiceController::markPaid()`
* **Database:** UPDATE invoice status, optionally INSERT payment

* **Functional Status:** ✅ Fully implemented

---

### PAYMENTS

#### List Payments

* **Frontend Page:** `src/pages/Payments.tsx`
* **Hook:** `usePayments()`
* **Endpoint:** `GET /api/payments`
* **Controller:** `PaymentController::index()`

* **CRUD Coverage:** ✅ Full CRUD

* **Functional Status:** ✅ Fully implemented

---

### TEMPLATES (Invoice Design)

#### List Templates

* **Frontend Page:** `src/pages/Templates.tsx`
* **Hook:** `useTemplates()`
* **Endpoint:** `GET /api/templates`
* **Controller:** `TemplateController::index()`

* **CRUD Coverage:** ✅ Full CRUD + Set Default

* **Functional Status:** ✅ Fully implemented

---

### RECURRING INVOICES

#### List Recurring Invoices

* **Frontend Page:** `src/pages/RecurringInvoices.tsx`
* **Hook:** `useRecurringInvoices()`
* **Endpoint:** `GET /api/recurring-invoices`
* **Controller:** `RecurringInvoiceController::getAll()`

* **CRUD Coverage:** ✅ Full CRUD + Status Toggle

* **Cron Integration:** `POST /api/recurring-invoices/process`

* **Functional Status:** ✅ Fully implemented

---

### REMINDERS

#### List Reminders

* **Frontend Page:** `src/pages/Reminders.tsx`
* **Hook:** `useReminders()`
* **Endpoint:** `GET /api/reminders`
* **Controller:** `ReminderController::index()`

* **CRUD Coverage:** Create, Read, Delete (no update needed)

* **Cron Integration:** `POST /api/reminders/process`

* **Functional Status:** ✅ Fully implemented

---

### CREDITS SYSTEM

#### Get Credits Usage

* **Frontend Component:** `src/components/credits/CreditsWidget.tsx`
* **Hook:** `useCredits()`
* **Endpoint:** `GET /api/credits/usage`
* **Controller:** `CreditsController::getUsage()`

* **Business Logic**
  * Returns used/total credits for current month
  * Separate counts for email and SMS

* **Functional Status:** ✅ Fully implemented

---

### REPORTS & DASHBOARD

#### Dashboard Stats

* **Frontend Page:** `src/pages/Dashboard.tsx`
* **Endpoint:** `GET /api/reports/dashboard`
* **Controller:** `ReportController::dashboard()`

* **Returns:**
  * Total revenue
  * Outstanding amount
  * Invoice count
  * Client count
  * Recent activity

* **Functional Status:** ✅ Fully implemented

---

### SUBSCRIPTION & BILLING

#### Get Subscription

* **Frontend Page:** `src/pages/Subscription.tsx`
* **Endpoint:** `GET /api/subscription`
* **Controller:** `SubscriptionController::getSubscription()`

* **Functional Status:** ✅ Fully implemented

---

#### PayFast Checkout

* **Frontend Hook:** `usePayfast()`
* **Endpoint:** `POST /api/payfast/checkout`
* **Controller:** `PayfastController::checkout()`

* **Webhook:** `POST /api/payfast/webhook` (public, no auth)

* **Functional Status:** ✅ Fully implemented

---

### ADMIN PANEL

#### Admin Login (3-Step)

* **Frontend Page:** `src/pages/admin/AdminLogin.tsx`
* **Endpoints:**
  * `POST /admin/login/step1`
  * `POST /admin/login/step2`
  * `POST /admin/login/step3`

* **Controller:** `AdminController.php`

* **Business Logic**
  * Step 1: Email + Password 1
  * Step 2: Password 2 (within 2 min)
  * Step 3: Password 3 (within 2 min)
  * Each step validates session token

* **Functional Status:** ✅ Fully implemented

---

#### Admin Dashboard

* **Frontend Page:** `src/pages/admin/AdminDashboard.tsx`
* **Endpoint:** `GET /api/admin/dashboard`
* **Controller:** `AdminController::getDashboard()`

* **Functional Status:** ✅ Fully implemented

---

## 3️⃣ API Endpoint Inventory (Canonical List)

| Endpoint | Method | Controller | Auth | Purpose | Tables |
|----------|--------|------------|------|---------|--------|
| `/health` | GET | HealthController::check | No | Health check | - |
| `/register` | POST | AuthController::register | No | User registration | users, api_tokens |
| `/login` | POST | AuthController::login | No | User login | users, api_tokens |
| `/logout` | POST | AuthController::logout | Yes | User logout | api_tokens |
| `/user` | GET | AuthController::user | Yes | Get current user | users |
| `/profile` | PUT | AuthController::updateProfile | Yes | Update profile | users |
| `/password` | PUT | AuthController::updatePassword | Yes | Change password | users |
| `/avatar` | POST | AuthController::uploadAvatar | Yes | Upload avatar | users |
| `/avatar` | DELETE | AuthController::deleteAvatar | Yes | Delete avatar | users |
| `/upload-logo` | POST | AuthController::uploadLogo | Yes | Upload business logo | users |
| `/logo` | DELETE | AuthController::deleteLogo | Yes | Delete logo | users |
| `/plan` | PUT | AuthController::updatePlan | Yes | Change subscription plan | users |
| `/verify-email` | POST | AuthController::verifyEmail | No | Verify email | users, email_verification_tokens |
| `/resend-verification` | POST | AuthController::resendVerification | Yes | Resend verification | email_verification_tokens |
| `/forgot-password` | POST | AuthController::forgotPassword | No | Request password reset | password_reset_tokens |
| `/reset-password` | POST | AuthController::resetPassword | No | Reset password | users, password_reset_tokens |
| `/auth/google` | GET | GoogleAuthController::getAuthUrl | No | Get OAuth URL | - |
| `/auth/google/callback` | POST | GoogleAuthController::callback | No | OAuth callback | users, api_tokens |
| `/clients` | GET | ClientController::index | Yes | List clients | clients |
| `/clients` | POST | ClientController::store | Yes | Create client | clients |
| `/clients/{id}` | GET | ClientController::show | Yes | Get client | clients |
| `/clients/{id}` | PUT | ClientController::update | Yes | Update client | clients |
| `/clients/{id}` | DELETE | ClientController::destroy | Yes | Delete client | clients |
| `/client-groups` | GET | ClientGroupController::index | Yes | List groups | client_groups |
| `/client-groups` | POST | ClientGroupController::store | Yes | Create group | client_groups |
| `/client-groups/{id}` | PUT | ClientGroupController::update | Yes | Update group | client_groups |
| `/client-groups/{id}` | DELETE | ClientGroupController::destroy | Yes | Delete group | client_groups |
| `/products` | GET | ProductController::index | Yes | List products | products |
| `/products` | POST | ProductController::store | Yes | Create product | products |
| `/products/{id}` | GET | ProductController::show | Yes | Get product | products |
| `/products/{id}` | PUT | ProductController::update | Yes | Update product | products |
| `/products/{id}` | DELETE | ProductController::destroy | Yes | Delete product | products |
| `/products/categories` | GET | ProductController::categories | Yes | Get categories | products |
| `/invoices` | GET | InvoiceController::index | Yes | List invoices | invoices, invoice_items |
| `/invoices` | POST | InvoiceController::store | Yes | Create invoice | invoices, invoice_items |
| `/invoices/{id}` | GET | InvoiceController::show | Yes | Get invoice | invoices, invoice_items |
| `/invoices/{id}` | PUT | InvoiceController::update | Yes | Update invoice | invoices, invoice_items |
| `/invoices/{id}` | DELETE | InvoiceController::destroy | Yes | Delete invoice | invoices |
| `/invoices/{id}/mark-paid` | POST | InvoiceController::markPaid | Yes | Mark as paid | invoices, payments |
| `/invoices/{id}/pdf` | GET | PdfController::generate | Yes | Preview PDF | invoices |
| `/invoices/{id}/pdf/download` | GET | PdfController::download | Yes | Download PDF | invoices |
| `/invoices/{id}/send` | POST | NotificationController::sendEmail | Yes | Send email | invoices, notification_logs |
| `/invoices/{id}/send-sms` | POST | NotificationController::sendSms | Yes | Send SMS | invoices, notification_logs |
| `/invoices/{id}/email-preview` | GET | NotificationController::emailPreview | Yes | Preview email | invoices |
| `/payments` | GET | PaymentController::index | Yes | List payments | payments |
| `/payments` | POST | PaymentController::store | Yes | Create payment | payments |
| `/payments/{id}` | GET | PaymentController::show | Yes | Get payment | payments |
| `/payments/{id}` | DELETE | PaymentController::destroy | Yes | Delete payment | payments |
| `/payments/summary` | GET | PaymentController::summary | Yes | Payment summary | payments |
| `/templates` | GET | TemplateController::index | Yes | List templates | invoice_templates |
| `/templates` | POST | TemplateController::store | Yes | Create template | invoice_templates |
| `/templates/{id}` | PUT | TemplateController::update | Yes | Update template | invoice_templates |
| `/templates/{id}` | DELETE | TemplateController::destroy | Yes | Delete template | invoice_templates |
| `/templates/{id}/set-default` | POST | TemplateController::setDefault | Yes | Set as default | invoice_templates |
| `/message-templates` | GET | MessageTemplateController::index | Yes | List templates | message_templates |
| `/message-templates/email` | GET/POST | MessageTemplateController | Yes | Email templates | message_templates |
| `/message-templates/sms` | GET/POST | MessageTemplateController | Yes | SMS templates | message_templates |
| `/reminders` | GET | ReminderController::index | Yes | List reminders | reminders |
| `/reminders` | POST | ReminderController::store | Yes | Create reminder | reminders |
| `/reminders/{id}` | DELETE | ReminderController::destroy | Yes | Delete reminder | reminders |
| `/reminders/process` | POST | ReminderController::processPending | No* | Cron job | reminders |
| `/recurring-invoices` | GET | RecurringInvoiceController::getAll | Yes | List recurring | recurring_invoices |
| `/recurring-invoices` | POST | RecurringInvoiceController::create | Yes | Create recurring | recurring_invoices |
| `/recurring-invoices/{id}` | PUT | RecurringInvoiceController::update | Yes | Update recurring | recurring_invoices |
| `/recurring-invoices/{id}` | DELETE | RecurringInvoiceController::delete | Yes | Delete recurring | recurring_invoices |
| `/recurring-invoices/process` | POST | RecurringInvoiceController::processDue | No* | Cron job | recurring_invoices |
| `/credits/usage` | GET | CreditsController::getUsage | Yes | Get usage | credits_usage |
| `/credits/check` | GET | CreditsController::checkCredits | Yes | Check available | credits_usage |
| `/credits/plans` | GET | CreditsController::getPlans | No | Get plan limits | - |
| `/reports/dashboard` | GET | ReportController::dashboard | Yes | Dashboard stats | invoices, payments, clients |
| `/reports/monthly-revenue` | GET | ReportController::monthlyRevenue | Yes | Revenue chart | invoices, payments |
| `/reports/invoice-status` | GET | ReportController::invoiceStatus | Yes | Status breakdown | invoices |
| `/reports/top-clients` | GET | ReportController::topClients | Yes | Top clients | clients, invoices |
| `/notifications` | GET | UserNotificationController::index | Yes | List notifications | user_notifications |
| `/notifications/{id}/read` | PATCH | UserNotificationController::markAsRead | Yes | Mark read | user_notifications |
| `/subscription` | GET | SubscriptionController::getSubscription | Yes | Get subscription | subscriptions |
| `/payfast/checkout` | POST | PayfastController::checkout | Yes | Init payment | payments |
| `/payfast/webhook` | POST | PayfastController::webhook | No | Payment callback | payments, subscriptions |
| `/paystack/initialize` | POST | PaystackController::initialize | Yes | Init payment | - |
| `/paystack/verify/{ref}` | GET | PaystackController::verify | Yes | Verify payment | payments |
| `/contact` | POST | ContactController::submit | No | Contact form | contact_submissions |
| `/gdpr/export` | GET | GdprController::export | Yes | Export data | all user data |
| `/gdpr/delete` | DELETE | GdprController::delete | Yes | Delete account | all user data |
| `/admin/login/step1-3` | POST | AdminController | No | Admin login | admin_sessions |
| `/admin/dashboard` | GET | AdminController::getDashboard | Admin | Admin stats | various |
| `/admin/users` | GET | AuthController::getAdminUsers | Admin | List admins | users |

*No auth but should be called from cron with secret

---

## 4️⃣ Authentication & Authorization Map

### Login Flow
1. User submits email/password to `/login`
2. Backend validates credentials and reCAPTCHA
3. Backend generates token, stores hash in `api_tokens`
4. Frontend stores token in localStorage
5. Frontend sets user in AuthContext
6. Frontend redirects to `/dashboard`

### Token Handling
- **Storage:** localStorage as `token`
- **Usage:** Axios interceptor adds `Authorization: Bearer {token}` to all requests
- **Validation:** AuthMiddleware validates on each protected request
- **Expiry:** 30 days from creation

### Protected Routes (Frontend)
All routes wrapped in `ProtectedRoute` component which:
1. Checks `getToken()` for localStorage token
2. Checks `user` from AuthContext
3. Shows loading if token exists but user not loaded
4. Redirects to `/login` if neither exists

### Admin Routes
- Require 3-step authentication
- Store admin session in `admin_sessions` table
- Validate admin token via `AdminController` middleware

### Auth Failure Points
1. **Token expired:** 401 response, frontend redirects to login
2. **Token invalid:** 401 response, frontend clears token and redirects
3. **Race condition:** Fixed by checking localStorage token in ProtectedRoute

---

## 5️⃣ Data Integrity & Real-Data Verification

### Login
- ✅ Real token inserted in `api_tokens`
- ✅ Token hash verified before response

### Registration
- ✅ Real user inserted in `users`
- ✅ Verification email sent
- ⚠️ No rollback if email fails (user exists without verification)

### Invoice Creation
- ✅ Transaction used for invoice + items
- ✅ Rollback on failure
- ✅ Verified before response

### Payment Recording
- ✅ Real payment inserted
- ✅ Invoice status updated in same transaction

### Recurring Invoice Processing
- ✅ Creates real invoices
- ✅ Updates next_run_date
- ✅ Handles errors per-invoice

### Mock Data
- ❌ No mock/placeholder data in production code
- ✅ Seed data only in QaController (admin-only)

---

## 6️⃣ Testing & Observability Gaps

### Existing Test Pages
- `src/pages/QaConsole.tsx` - User-facing test page
- `src/pages/admin/AdminQaConsole.tsx` - Admin test console

### Tested Features (via QA Console)
- Database seed/cleanup
- Health check
- Basic CRUD operations

### Missing Tests
- ❌ No automated unit tests
- ❌ No integration tests
- ❌ No E2E tests
- ❌ No load testing
- ⚠️ Manual testing only

### Observability
- ✅ Console logging in frontend
- ✅ Error logging in controllers
- ✅ Admin activity logging
- ✅ Email/notification logs
- ⚠️ No centralized error tracking (Sentry, etc.)

---

## 7️⃣ Final Readiness Assessment

### Production Readiness: ⚠️ MOSTLY READY

### Summary
| Area | Status |
|------|--------|
| Authentication | ✅ Ready |
| CRUD Operations | ✅ Ready |
| Payment Integration | ✅ Ready |
| Email/SMS | ✅ Ready |
| PDF Generation | ✅ Ready |
| Admin Panel | ✅ Ready |
| Error Handling | ⚠️ Needs review |
| Testing | ❌ Missing |
| Monitoring | ⚠️ Basic only |

### Highest-Risk Areas
1. **No automated testing** - Manual testing only
2. **Error handling inconsistency** - Some endpoints may not handle all edge cases
3. **Rate limiting** - Implemented but needs verification
4. **Cron jobs** - Require external scheduler setup

### Recommended Audit Order
1. ✅ Fix login redirect loop (DONE)
2. ✅ Fix invoice modal blank screen (DONE)
3. Verify all CRUD operations with real data
4. Test payment webhooks in staging
5. Set up cron jobs for reminders/recurring
6. Add error tracking (Sentry recommended)
7. Implement basic E2E tests for critical flows

### Environment Requirements
- PHP 8.0+ with Argon2
- MySQL 8.0+
- SMTP server configured
- Google OAuth credentials
- PayFast/Paystack credentials
- reCAPTCHA v3 keys
- Cron access for scheduled tasks

---

## Appendix: File Reference

### Frontend Entry Points
- `src/main.tsx` - React bootstrap
- `src/App.tsx` - Router configuration
- `src/contexts/AuthContext.tsx` - Auth state

### Backend Entry Point
- `api/index.php` - Router + all routes

### Critical Files
- `src/services/api.ts` - All API calls
- `api/middleware/AuthMiddleware.php` - Token validation
- `api/core/Auth.php` - Auth utilities
- `api/core/Mailer.php` - Email sending

