# 📋 Ieosuia Invoices - Complete Application Architecture Map

> **Generated**: Auto-explored comprehensive mapping of all pages, endpoints, components, and data flows.

---

## 🏗️ Architecture Overview

| Layer | Technology | Location |
|-------|------------|----------|
| **Frontend** | React + TypeScript + Vite | `src/` |
| **Styling** | Tailwind CSS + shadcn/ui | `src/components/ui/` |
| **State** | React Query + Context | `src/hooks/`, `src/contexts/` |
| **API Client** | Axios | `src/services/api.ts` |
| **Backend** | PHP (Custom MVC) | `api/` |
| **Database** | MySQL | 31 tables |
| **Auth** | JWT + Google OAuth | `api/core/Auth.php` |

---

## 📄 Page Map (41 Routes Total)

### 🌐 Public Routes (17)

| Route | Page Component | Purpose | Key Actions |
|-------|---------------|---------|-------------|
| `/` | `Index.tsx` | Landing page | Navigate to login/register |
| `/login` | `Login.tsx` | User login | Email/password + Google OAuth |
| `/register` | `Register.tsx` | User registration | Create account with plan selection |
| `/verify-email` | `VerifyEmail.tsx` | Email verification | Verify token from email |
| `/forgot-password` | `ForgotPassword.tsx` | Password reset request | Send reset email |
| `/reset-password` | `ResetPassword.tsx` | Password reset | Update password with token |
| `/privacy-policy` | `PrivacyPolicy.tsx` | Legal | Static content |
| `/terms-of-service` | `TermsOfService.tsx` | Legal | Static content |
| `/cookie-policy` | `CookiePolicy.tsx` | Legal | Static content |
| `/popia-compliance` | `PopiaCompliance.tsx` | Legal (South Africa) | Static content |
| `/contact` | `Contact.tsx` | Contact form | Submit inquiry |
| `/support` | `Support.tsx` | Support info | Static content |
| `/documentation` | `Documentation.tsx` | Docs | Static content |
| `/careers` | `Careers.tsx` | Jobs | Static content |
| `/faq` | `FAQ.tsx` | FAQ | Static content |
| `/auth/google/callback` | `GoogleCallback.tsx` | OAuth callback | Process Google auth |
| `/admin-setup` | `AdminSetup.tsx` | Initial admin setup | Create first admin user |

### 🔐 Protected Dashboard Routes (18)

| Route | Page Component | Purpose | Key Actions |
|-------|---------------|---------|-------------|
| `/dashboard` | `Dashboard.tsx` | Main dashboard | View stats, recent activity |
| `/dashboard/invoices` | `Invoices.tsx` | Invoice management | CRUD invoices, send, PDF |
| `/dashboard/clients` | `Clients.tsx` | Client management | CRUD clients |
| `/dashboard/products` | `Products.tsx` | Product/service catalog | CRUD products |
| `/dashboard/reports` | `Reports.tsx` | Business reports | View analytics, charts |
| `/dashboard/analytics` | `Analytics.tsx` | Advanced analytics | Extended metrics |
| `/dashboard/payments` | `Payments.tsx` | Payment tracking | View/record payments |
| `/dashboard/payment-history` | `PaymentHistory.tsx` | Payment history | View all transactions |
| `/dashboard/templates` | `Templates.tsx` | Invoice templates | CRUD templates |
| `/dashboard/profile` | `Profile.tsx` | User profile | Update info, avatar, logo |
| `/dashboard/settings` | `Settings.tsx` | App settings | Configure preferences |
| `/dashboard/reminders` | `Reminders.tsx` | Payment reminders | Manage auto-reminders |
| `/dashboard/recurring` | `RecurringInvoices.tsx` | Recurring invoices | CRUD recurring schedules |
| `/dashboard/notifications` | `NotificationHistory.tsx` | Notification logs | View sent notifications |
| `/dashboard/email-templates` | `EmailTemplates.tsx` | Email templates | Customize emails |
| `/dashboard/subscription` | `Subscription.tsx` | Plan management | View/upgrade plan |
| `/dashboard/billing` | `BillingPortal.tsx` | Billing portal | Payment methods, history |
| `/dashboard/qa` | `QaConsole.tsx` | QA tools | Dev testing tools |
| `/verify-email-reminder` | `VerifyEmailReminder.tsx` | Email reminder | Resend verification |

### 🛡️ Admin Routes (10)

| Route | Page Component | Purpose | Key Actions |
|-------|---------------|---------|-------------|
| `/admin` | `AdminIndex.tsx` | Admin entry | Redirect to login/dashboard |
| `/admin/login` | `AdminLogin.tsx` | 3-step admin login | Multi-password auth |
| `/admin/dashboard` | `AdminDashboard.tsx` | Admin dashboard | System overview |
| `/admin/submissions` | `AdminSubmissions.tsx` | Contact submissions | View/respond to contacts |
| `/admin/submissions/:id` | `AdminSubmissions.tsx` | Single submission | View submission detail |
| `/admin/email-logs` | `AdminEmailLogs.tsx` | Email logs | Monitor email delivery |
| `/admin/settings` | `AdminSettings.tsx` | Admin settings | Configure admin options |
| `/admin/qa` | `AdminQaConsole.tsx` | QA console | Seed/cleanup test data |
| `/admin/users` | `AdminUsers.tsx` | User management | Manage all users |
| `/admin/activity-logs` | `AdminActivityLogs.tsx` | Activity logs | Audit trail |
| `/admin/subscriptions` | `AdminSubscriptions.tsx` | Subscriptions | Manage user plans |

### 💳 Payment Result Routes (2)

| Route | Page Component | Purpose |
|-------|---------------|---------|
| `/payment/success` | `PaymentSuccess.tsx` | Payment confirmation |
| `/payment/failed` | `PaymentFailed.tsx` | Payment failure |

---

## 🔌 API Endpoints (92 Total)

### Authentication & User (15 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| POST | `/register` | AuthController::register | ❌ | Create account |
| POST | `/login` | AuthController::login | ❌ | Login |
| POST | `/logout` | AuthController::logout | ✅ | Logout |
| GET | `/user` | AuthController::user | ✅ | Get current user |
| PUT | `/profile` | AuthController::updateProfile | ✅ | Update profile |
| PUT | `/password` | AuthController::updatePassword | ✅ | Change password |
| POST | `/avatar` | AuthController::uploadAvatar | ✅ | Upload avatar |
| DELETE | `/avatar` | AuthController::deleteAvatar | ✅ | Delete avatar |
| PUT | `/plan` | AuthController::updatePlan | ✅ | Change plan |
| POST | `/verify-email` | AuthController::verifyEmail | ❌ | Verify email token |
| POST | `/resend-verification` | AuthController::resendVerification | ✅ | Resend verify email |
| POST | `/forgot-password` | AuthController::forgotPassword | ❌ | Request password reset |
| POST | `/reset-password` | AuthController::resetPassword | ❌ | Reset password |
| POST | `/upload-logo` | AuthController::uploadLogo | ✅ | Upload business logo |
| DELETE | `/logo` | AuthController::deleteLogo | ✅ | Delete logo |

### Google OAuth (2 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/auth/google` | GoogleAuthController::getAuthUrl | ❌ | Get OAuth URL |
| POST | `/auth/google/callback` | GoogleAuthController::callback | ❌ | Handle OAuth callback |

### Clients CRUD (5 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/clients` | ClientController::index | ✅ | List all clients |
| POST | `/clients` | ClientController::store | ✅ | Create client |
| GET | `/clients/{id}` | ClientController::show | ✅ | Get client |
| PUT | `/clients/{id}` | ClientController::update | ✅ | Update client |
| DELETE | `/clients/{id}` | ClientController::destroy | ✅ | Delete client |

### Products CRUD (6 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/products` | ProductController::index | ✅ | List products |
| GET | `/products/categories` | ProductController::categories | ✅ | Get categories |
| POST | `/products` | ProductController::store | ✅ | Create product |
| GET | `/products/{id}` | ProductController::show | ✅ | Get product |
| PUT | `/products/{id}` | ProductController::update | ✅ | Update product |
| DELETE | `/products/{id}` | ProductController::destroy | ✅ | Delete product |

### Invoices CRUD + Actions (8 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/invoices` | InvoiceController::index | ✅ | List invoices |
| POST | `/invoices` | InvoiceController::store | ✅ | Create invoice |
| GET | `/invoices/{id}` | InvoiceController::show | ✅ | Get invoice |
| PUT | `/invoices/{id}` | InvoiceController::update | ✅ | Update invoice |
| DELETE | `/invoices/{id}` | InvoiceController::destroy | ✅ | Delete invoice |
| POST | `/invoices/{id}/mark-paid` | InvoiceController::markPaid | ✅ | Mark as paid |
| GET | `/invoices/{id}/pdf` | PdfController::generate | ✅ | View PDF |
| GET | `/invoices/{id}/pdf/download` | PdfController::download | ✅ | Download PDF |

### Payments (5 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/payments` | PaymentController::index | ✅ | List payments |
| POST | `/payments` | PaymentController::store | ✅ | Record payment |
| GET | `/payments/summary` | PaymentController::summary | ✅ | Get summary |
| GET | `/payments/{id}` | PaymentController::show | ✅ | Get payment |
| DELETE | `/payments/{id}` | PaymentController::destroy | ✅ | Delete payment |

### Templates CRUD (6 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/templates` | TemplateController::index | ✅ | List templates |
| POST | `/templates` | TemplateController::store | ✅ | Create template |
| GET | `/templates/{id}` | TemplateController::show | ✅ | Get template |
| PUT | `/templates/{id}` | TemplateController::update | ✅ | Update template |
| DELETE | `/templates/{id}` | TemplateController::destroy | ✅ | Delete template |
| POST | `/templates/{id}/set-default` | TemplateController::setDefault | ✅ | Set as default |

### Reports (10 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/reports/dashboard` | ReportController::dashboard | ✅ | Dashboard stats |
| GET | `/reports/monthly-revenue` | ReportController::monthlyRevenue | ✅ | Monthly revenue |
| GET | `/reports/invoice-status` | ReportController::invoiceStatus | ✅ | Invoice breakdown |
| GET | `/reports/top-clients` | ReportController::topClients | ✅ | Top clients |
| GET | `/reports/income-expense` | ReportController::incomeExpense | ✅ | Income vs expense |
| GET | `/reports/recent-invoices` | ReportController::recentInvoices | ✅ | Recent invoices |
| GET | `/reports/payment-timeline` | ReportController::paymentTimeline | ✅ | Payment timeline |
| GET | `/reports/billing-history` | ReportController::billingHistory | ✅ | Billing history |
| GET | `/reports/extended-stats` | ReportController::extendedStats | ✅ | Extended stats |
| GET | `/reports/monthly-stats` | ReportController::monthlyStats | ✅ | Monthly stats |

### Notifications (8 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| POST | `/invoices/{id}/send` | NotificationController::sendEmail | ✅ | Send invoice email |
| GET | `/invoices/{id}/email-preview` | NotificationController::emailPreview | ✅ | Preview email |
| POST | `/invoices/{id}/send-sms` | NotificationController::sendSms | ✅ | Send SMS |
| GET | `/notifications` | UserNotificationController::index | ✅ | Get notifications |
| PATCH | `/notifications/{id}/read` | UserNotificationController::markAsRead | ✅ | Mark as read |
| POST | `/notifications/mark-all-read` | UserNotificationController::markAllAsRead | ✅ | Mark all read |
| DELETE | `/notifications/{id}` | UserNotificationController::delete | ✅ | Delete notification |
| DELETE | `/notifications` | UserNotificationController::clearAll | ✅ | Clear all |

### Reminders (7 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/reminders` | ReminderController::index | ✅ | List reminders |
| POST | `/reminders` | ReminderController::store | ✅ | Create reminder |
| DELETE | `/reminders/{id}` | ReminderController::destroy | ✅ | Delete reminder |
| POST | `/invoices/{id}/reminders` | ReminderController::scheduleForInvoice | ✅ | Schedule for invoice |
| GET | `/reminders/settings` | ReminderController::getSettings | ✅ | Get settings |
| PUT | `/reminders/settings` | ReminderController::updateSettings | ✅ | Update settings |
| POST | `/reminders/process` | ReminderController::processPending | ❌ | Cron: process pending |

### Recurring Invoices (8 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/recurring-invoices` | RecurringInvoiceController::getAll | ✅ | List recurring |
| GET | `/recurring-invoices/{id}` | RecurringInvoiceController::getById | ✅ | Get recurring |
| POST | `/recurring-invoices` | RecurringInvoiceController::create | ✅ | Create recurring |
| PUT | `/recurring-invoices/{id}` | RecurringInvoiceController::update | ✅ | Update recurring |
| DELETE | `/recurring-invoices/{id}` | RecurringInvoiceController::delete | ✅ | Delete recurring |
| PATCH | `/recurring-invoices/{id}/status` | RecurringInvoiceController::updateStatus | ✅ | Toggle status |
| POST | `/recurring-invoices/{id}/generate` | RecurringInvoiceController::generate | ✅ | Generate invoice |
| POST | `/recurring-invoices/process` | RecurringInvoiceController::processDue | ❌ | Cron: process due |

### Credits System (6 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/credits/usage` | CreditsController::getUsage | ✅ | Get usage |
| GET | `/credits/check` | CreditsController::checkCredits | ✅ | Check credits |
| POST | `/credits/use` | CreditsController::useCredits | ✅ | Use credits |
| GET | `/credits/logs` | CreditsController::getNotificationLogs | ✅ | Get logs |
| GET | `/credits/plans` | CreditsController::getPlans | ❌ | Get plan info |
| POST | `/credits/reset` | CreditsController::resetMonthlyCredits | ❌ | Cron: reset monthly |

### Payment Gateways

#### PayFast (7 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| POST | `/payfast/checkout` | PayfastController::checkout | ✅ | Initiate checkout |
| POST | `/payfast/invoice` | PayfastController::invoicePayment | ✅ | Invoice payment |
| POST | `/payfast/webhook` | PayfastController::webhook | ❌ | Webhook |
| POST | `/payfast/invoice-webhook` | PayfastController::invoiceWebhook | ❌ | Invoice webhook |
| POST | `/payfast/subscription-webhook` | PayfastController::subscriptionWebhook | ❌ | Subscription webhook |
| POST | `/payfast/cancel-subscription` | PayfastController::cancelSubscription | ✅ | Cancel subscription |

#### Paystack (4 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| POST | `/paystack/initialize` | PaystackController::initialize | ✅ | Initialize payment |
| GET | `/paystack/verify/{reference}` | PaystackController::verify | ✅ | Verify payment |
| POST | `/paystack/webhook` | PaystackController::webhook | ❌ | Webhook |
| GET | `/paystack/config` | PaystackController::config | ❌ | Get public config |

### Billing Portal (7 endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| GET | `/billing/portal` | BillingController::getPortal | ✅ | Get portal data |
| GET | `/billing/transactions` | BillingController::getTransactions | ✅ | Get transactions |
| POST | `/billing/payment-methods` | BillingController::addPaymentMethod | ✅ | Add payment method |
| POST | `/billing/payment-methods/{id}/default` | BillingController::setDefaultPaymentMethod | ✅ | Set default |
| DELETE | `/billing/payment-methods/{id}` | BillingController::removePaymentMethod | ✅ | Remove method |
| GET | `/billing/transactions/{id}/invoice` | BillingController::downloadInvoice | ✅ | Download invoice |
| GET | `/billing/retry-status` | BillingController::getRetryStatus | ✅ | Get retry status |

### Admin (25+ endpoints)

| Method | Endpoint | Controller | Auth | Purpose |
|--------|----------|------------|------|---------|
| POST | `/admin/setup` | AuthController::createAdmin | ❌ | Initial setup |
| POST | `/admin/check-email` | AuthController::checkAdminEmail | ❌ | Check admin email |
| POST | `/admin/login/batch` | AuthController::adminLoginBatch | ❌ | Batch login |
| POST | `/admin/login/step1-3` | AdminController::loginStep1-3 | ❌ | 3-step login |
| POST | `/admin/logout` | AdminController::logout | ✅ | Logout |
| GET | `/admin/dashboard` | AdminController::getDashboard | ✅ | Dashboard |
| GET | `/admin/submissions` | AdminController::getSubmissions | ✅ | Get submissions |
| PUT | `/admin/submissions/{id}` | AdminController::updateSubmission | ✅ | Update submission |
| DELETE | `/admin/submissions/{id}` | AdminController::deleteSubmission | ✅ | Delete submission |
| GET | `/admin/email-logs` | AdminController::getEmailLogs | ✅ | Get email logs |
| GET | `/admin/activity-logs` | AdminController::getActivityLogs | ✅ | Get activity logs |
| GET | `/admin/users` | AuthController::getAdminUsers | ✅ | Get users |
| PUT | `/admin/users/{id}` | AuthController::updateAdminUser | ✅ | Update user |
| PATCH | `/admin/users/{id}/toggle` | AuthController::toggleAdminStatus | ✅ | Toggle status |
| DELETE | `/admin/users/{id}` | AuthController::deleteAdminUser | ✅ | Delete user |

---

## 🧩 Component Architecture

### Layout Components

```
src/components/
├── dashboard/
│   ├── DashboardHeader.tsx    # Top navigation bar
│   ├── DashboardSidebar.tsx   # Main sidebar navigation
│   └── StatCard.tsx           # Statistic display cards
├── admin/
│   ├── AdminLayout.tsx        # Admin page wrapper
│   └── AdminSidebar.tsx       # Admin navigation
└── landing/
    ├── Navbar.tsx             # Public navbar
    ├── HeroSection.tsx        # Hero section
    ├── FeaturesSection.tsx    # Features display
    ├── HowItWorksSection.tsx  # How it works
    ├── PricingSection.tsx     # Pricing tables
    ├── TestimonialsSection.tsx # Testimonials
    ├── ContactSection.tsx     # Contact form
    └── Footer.tsx             # Site footer
```

### Feature Components

```
src/components/
├── clients/
│   ├── ClientModal.tsx        # Create/edit client
│   └── DeleteClientDialog.tsx # Delete confirmation
├── products/
│   ├── ProductModal.tsx       # Create/edit product
│   └── DeleteProductDialog.tsx
├── invoices/
│   ├── InvoiceModal.tsx       # Create/edit invoice
│   ├── DeleteInvoiceDialog.tsx
│   ├── InlineProductForm.tsx  # Quick add product
│   ├── RecurringInvoiceModal.tsx
│   ├── ScheduleReminderDialog.tsx
│   ├── SendEmailDialog.tsx    # Send invoice via email
│   └── SendSmsDialog.tsx      # Send invoice via SMS
├── payments/
│   ├── PaymentModal.tsx       # Record payment
│   └── DeletePaymentDialog.tsx
├── templates/
│   ├── TemplateCard.tsx       # Template preview
│   ├── TemplateEditor.tsx     # Full editor
│   └── TemplatePresets.tsx    # Preset selection
├── credits/
│   ├── CreditsDisplay.tsx     # Credits info
│   └── CreditsWidget.tsx      # Widget display
├── billing/
│   └── PaymentRetryStatus.tsx # Retry status
├── profile/
│   ├── AvatarUpload.tsx       # Avatar management
│   ├── LogoUpload.tsx         # Business logo
│   └── PasswordChange.tsx     # Password form
└── exports/
    └── ExportDropdown.tsx     # Export options
```

---

## 🪝 Custom Hooks

| Hook | Purpose | API Service Used |
|------|---------|------------------|
| `useClients` | Client CRUD operations | `clientService` |
| `useProducts` | Product CRUD operations | `productService` |
| `useInvoices` | Invoice CRUD operations | `invoiceService` |
| `usePayments` | Payment operations | `paymentService` |
| `useTemplates` | Template CRUD | `templateService` |
| `useReports` | Dashboard & reports | `reportService` |
| `useNotifications` | User notifications | `notificationService` |
| `useReminders` | Reminder management | `reminderService` |
| `useRecurringInvoices` | Recurring invoices | `recurringService` |
| `useCredits` | Credits management | `creditsService` |
| `useCreditCheck` | Credit availability | `creditsService` |
| `useCurrency` | Currency conversion | `currencyService` |
| `usePayfast` | PayFast integration | `payfastService` |
| `usePaystack` | Paystack integration | `paystackService` |
| `usePaymentRetry` | Payment retry logic | `paymentRetryService` |
| `useSendSms` | SMS sending | `notificationService` |
| `useExport` | Data export | Custom export utils |
| `useRecaptcha` | reCAPTCHA handling | Direct API |

---

## 🗄️ Database Schema (31 Tables)

### Core Business Tables

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `users` | User accounts | → clients, invoices, payments |
| `clients` | Customer records | → user_id, invoices |
| `products` | Product/service catalog | → user_id, invoice_items |
| `invoices` | Invoice records | → user_id, client_id, items |
| `invoice_items` | Line items | → invoice_id, product_id |
| `payments` | Payment records | → user_id, invoice_id |
| `templates` | Invoice templates | → user_id |

### Subscription & Billing

| Table | Purpose |
|-------|---------|
| `plan_limits` | Plan feature limits |
| `subscription_history` | Plan change history |
| `payment_transactions` | Transaction records |
| `payment_methods` | Stored payment methods |
| `payment_retry_notifications` | Retry notifications |

### Recurring & Reminders

| Table | Purpose |
|-------|---------|
| `recurring_invoices` | Recurring schedules |
| `recurring_invoice_items` | Recurring line items |
| `invoice_reminders` | Scheduled reminders |

### Notifications & Logs

| Table | Purpose |
|-------|---------|
| `notifications` | User notifications |
| `notification_logs` | Email/SMS logs |
| `email_logs` | Detailed email tracking |
| `email_verifications` | Verification tokens |

### Admin & Security

| Table | Purpose |
|-------|---------|
| `admin_users` | Admin accounts |
| `admin_sessions` | Admin sessions |
| `admin_activity_logs` | Audit trail |
| `admin_notification_settings` | Admin preferences |
| `api_tokens` | Auth tokens |
| `rate_limits` | Rate limiting |
| `password_resets` | Reset tokens |
| `blocked_email_domains` | Spam prevention |

### System

| Table | Purpose |
|-------|---------|
| `settings` | Global settings |
| `exchange_rates` | Currency rates |
| `contact_submissions` | Contact forms |
| `webhook_logs` | Webhook history |

---

## 🔄 Data Flow Diagrams

### Authentication Flow

```
User → Login.tsx → authService.login() 
    → POST /login → AuthController::login 
    → User model → JWT token 
    → localStorage → AuthContext → Dashboard
```

### Google OAuth Flow

```
User → "Login with Gmail" → authService.getGoogleAuthUrl()
    → GET /auth/google → Google consent
    → /auth/google/callback → GoogleCallback.tsx
    → POST /auth/google/callback → GoogleAuthController::callback
    → Create/find user → JWT token
    → AuthContext.setUserFromOAuth() → Dashboard
```

### Invoice Creation Flow

```
User → Invoices.tsx → InvoiceModal 
    → invoiceService.create() → POST /invoices 
    → InvoiceController::store → Invoice model
    → InvoiceItem model → Response 
    → useInvoices refetch → UI update
```

### Payment Processing Flow (PayFast)

```
User → Subscription.tsx → usePayfast.initiate()
    → POST /payfast/checkout → PayfastController::checkout
    → PayFast redirect → User pays
    → POST /payfast/webhook → Update subscription
    → /payment/success → PaymentSuccess.tsx
```

### Email Notification Flow

```
User → SendEmailDialog → notificationService.send()
    → POST /invoices/{id}/send 
    → NotificationController::sendEmail
    → PHPMailer → Email sent
    → notification_logs updated → Credits deducted
```

---

## ⚙️ CRUD Operation Matrix

| Entity | Create | Read | Update | Delete | Special Actions |
|--------|--------|------|--------|--------|-----------------|
| **Users** | ✅ Register | ✅ /user | ✅ /profile | ✅ GDPR delete | Avatar, Logo, Password |
| **Clients** | ✅ | ✅ | ✅ | ✅ | — |
| **Products** | ✅ | ✅ | ✅ | ✅ | Categories |
| **Invoices** | ✅ | ✅ | ✅ | ✅ | Mark paid, PDF, Send |
| **Payments** | ✅ | ✅ | — | ✅ | Summary |
| **Templates** | ✅ | ✅ | ✅ | ✅ | Set default |
| **Reminders** | ✅ | ✅ | ✅ | ✅ | Schedule, Settings |
| **Recurring** | ✅ | ✅ | ✅ | ✅ | Generate, Toggle |
| **Notifications** | — | ✅ | Mark read | ✅ | Clear all |

---

## 🔐 Security Layers

1. **JWT Authentication**: `api/core/Auth.php` + `AuthMiddleware.php`
2. **Rate Limiting**: `RateLimitMiddleware.php` + `rate_limits` table
3. **reCAPTCHA**: Forms protected with Google reCAPTCHA
4. **CORS**: Configured in `api/index.php`
5. **Input Validation**: Server-side validation in controllers
6. **Email Blocking**: `blocked_email_domains` table for spam
7. **Admin 3-Step Auth**: Triple password verification

---

## 📊 Plan Limits

| Plan | Monthly Price | Email Credits | SMS Credits | Invoices | Features |
|------|---------------|---------------|-------------|----------|----------|
| Free | R0 | 10 | 0 | 5 | Basic |
| Solo | R99 | 50 | 10 | 25 | Branding |
| Pro | R199 | 200 | 50 | Unlimited | Templates, Reminders |
| Business | R399 | 500 | 150 | Unlimited | Reports, Multi-user |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited | White-label, Priority |

---

## 🕐 Cron Jobs Required

| Endpoint | Frequency | Purpose |
|----------|-----------|---------|
| POST `/reminders/process` | Every 15 mins | Process pending reminders |
| POST `/recurring-invoices/process` | Daily | Generate due invoices |
| POST `/credits/reset` | Monthly | Reset credit usage |
| POST `/subscription/process-renewals` | Daily | Send renewal reminders |
| POST `/subscription/process-expired` | Daily | Handle expired subscriptions |
| POST `/payments/process-retries` | Daily | Retry failed payments |
| POST `/payments/process-grace-periods` | Daily | Handle grace periods |

---

## 🔍 Debugging Entry Points

| Issue | Check Location |
|-------|----------------|
| Login fails | `AuthController::login`, `api_tokens` table |
| 401 errors | `AuthMiddleware`, token expiry |
| Invoice not saving | `InvoiceController::store`, validation |
| Email not sending | `NotificationController`, `email_logs` |
| Payment failed | `PayfastController`, `payment_transactions` |
| Credits depleted | `CreditsController`, `notification_logs` |
| Admin access | `admin_sessions`, 3-step auth |

---

*This map provides complete navigation of the Ieosuia Invoices application architecture.*
