# Cypress E2E Tests

Comprehensive end-to-end tests for the invoice application.

## Test Suites

- **auth.cy.ts** - Login, registration, logout, protected routes, forgot password
- **invoices.cy.ts** - Invoice CRUD, send, download PDF, mark paid
- **payments.cy.ts** - Payment recording, deletion, subscription payments
- **clients.cy.ts** - Client CRUD, search, groups
- **products.cy.ts** - Product CRUD, categories
- **dashboard.cy.ts** - Dashboard overview, navigation, stats
- **reports.cy.ts** - Reports & analytics, exports
- **profile-settings.cy.ts** - Profile, password change, avatar, settings
- **landing-public.cy.ts** - Landing page, legal pages, 404
- **templates-recurring.cy.ts** - Templates, recurring invoices, reminders
- **admin.cy.ts** - Admin login, dashboard, user management

## Running Tests

```bash
# Open Cypress UI
npx cypress open

# Run all tests headless
npx cypress run

# Run specific test file
npx cypress run --spec cypress/e2e/auth.cy.ts
```

## Configuration

Update `cypress.config.ts` for:
- `baseUrl`: Frontend URL
- `env.apiUrl`: Backend API URL
- Test credentials in `cypress/fixtures/users.json`
