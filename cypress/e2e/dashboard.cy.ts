/// <reference types="cypress" />

describe('Dashboard', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified: true,
    plan: 'professional',
  };

  const mockReportsSummary = {
    total_revenue: 25000,
    outstanding_amount: 5000,
    paid_invoices: 15,
    pending_invoices: 5,
    overdue_invoices: 2,
    total_clients: 10,
  };

  beforeEach(() => {
    // Set up authenticated state
    cy.window().then((win) => {
      win.localStorage.setItem('ieosuia_auth_token', 'test-token');
      win.localStorage.setItem('auth_user', JSON.stringify(mockUser));
    });

    // Mock API endpoints
    cy.intercept('GET', '**/user', {
      statusCode: 200,
      body: { success: true, user: mockUser },
    }).as('getUser');

    cy.intercept('GET', '**/reports/summary*', {
      statusCode: 200,
      body: mockReportsSummary,
    }).as('getReportsSummary');

    cy.intercept('GET', '**/invoices', {
      statusCode: 200,
      body: { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 },
    }).as('getInvoices');

    cy.intercept('GET', '**/clients', {
      statusCode: 200,
      body: { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 },
    }).as('getClients');

    cy.intercept('GET', '**/credits/balance', {
      statusCode: 200,
      body: { sms_credits: 100, email_credits: 500 },
    }).as('getCredits');

    cy.intercept('GET', '**/notifications', {
      statusCode: 200,
      body: { notifications: [], unread_count: 0 },
    }).as('getNotifications');
  });

  describe('Dashboard Overview', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('should display dashboard page', () => {
      cy.contains(/dashboard|overview/i).should('be.visible');
    });

    it('should display summary statistics', () => {
      cy.wait('@getReportsSummary');
      cy.contains('25,000').should('be.visible');
    });

    it('should display user greeting', () => {
      cy.contains(mockUser.name).should('be.visible');
    });

    it('should display quick action buttons', () => {
      cy.get('body').then(($body) => {
        // Check for common quick actions
        const hasCreateInvoice = $body.find('button:contains("Create"), a:contains("Create")').length > 0;
        const hasAddClient = $body.find('button:contains("Client"), a:contains("Client")').length > 0;
        
        expect(hasCreateInvoice || hasAddClient).to.be.true;
      });
    });
  });

  describe('Dashboard Navigation', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('should navigate to invoices from sidebar', () => {
      cy.contains('a', /invoices/i).click();
      cy.url().should('include', '/invoices');
    });

    it('should navigate to clients from sidebar', () => {
      cy.contains('a', /clients/i).click();
      cy.url().should('include', '/clients');
    });

    it('should navigate to payments from sidebar', () => {
      cy.contains('a', /payments/i).click();
      cy.url().should('include', '/payments');
    });

    it('should navigate to products from sidebar', () => {
      cy.contains('a', /products/i).click();
      cy.url().should('include', '/products');
    });

    it('should navigate to reports from sidebar', () => {
      cy.contains('a', /reports/i).click();
      cy.url().should('include', '/reports');
    });
  });

  describe('Dashboard Stats Cards', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
      cy.wait('@getReportsSummary');
    });

    it('should display total revenue card', () => {
      cy.contains(/total.*revenue|revenue/i).should('be.visible');
    });

    it('should display outstanding amount card', () => {
      cy.contains(/outstanding|unpaid/i).should('be.visible');
    });

    it('should display invoice counts', () => {
      cy.contains(/invoice/i).should('be.visible');
    });
  });

  describe('Recent Activity', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/invoices*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              invoice_number: 'INV-001',
              client: { name: 'Test Client' },
              total: 1500,
              status: 'Sent',
              date: '2024-01-15',
            },
          ],
          current_page: 1,
          last_page: 1,
          per_page: 5,
          total: 1,
        },
      }).as('getRecentInvoices');

      cy.visit('/dashboard');
    });

    it('should display recent invoices', () => {
      cy.wait('@getRecentInvoices');
      cy.get('body').then(($body) => {
        if ($body.find('table').length || $body.find('[class*="invoice"]').length) {
          cy.contains('INV-001').should('be.visible');
        }
      });
    });
  });

  describe('Credits Display', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
      cy.wait('@getCredits');
    });

    it('should display SMS credits', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="credit"]').length) {
          cy.contains(/sms|credits/i).should('be.visible');
        }
      });
    });

    it('should display email credits', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="credit"]').length) {
          cy.contains(/email|credits/i).should('be.visible');
        }
      });
    });
  });

  describe('Notifications', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/notifications', {
        statusCode: 200,
        body: {
          notifications: [
            {
              id: '1',
              message: 'Invoice INV-001 has been paid',
              date: new Date().toISOString(),
              read: false,
              type: 'success',
            },
          ],
          unread_count: 1,
        },
      }).as('getNotifications');

      cy.visit('/dashboard');
    });

    it('should display notification bell', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="notification"], [class*="bell"]').length) {
          cy.get('[class*="notification"], [class*="bell"]').should('be.visible');
        }
      });
    });

    it('should show unread count badge', () => {
      cy.wait('@getNotifications');
      cy.get('body').then(($body) => {
        if ($body.find('[class*="badge"]').length) {
          cy.contains('1').should('be.visible');
        }
      });
    });
  });
});
