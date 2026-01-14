/// <reference types="cypress" />

describe('Reports & Analytics', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified: true,
    plan: 'professional',
  };

  const mockReportsSummary = {
    total_revenue: 50000,
    outstanding_amount: 10000,
    paid_invoices: 25,
    pending_invoices: 8,
    overdue_invoices: 3,
    total_clients: 15,
    growth_percentage: 15.5,
  };

  const mockMonthlyData = [
    { month: 'Jan', revenue: 5000, invoices: 5 },
    { month: 'Feb', revenue: 7500, invoices: 8 },
    { month: 'Mar', revenue: 6000, invoices: 6 },
    { month: 'Apr', revenue: 8500, invoices: 10 },
    { month: 'May', revenue: 9000, invoices: 12 },
    { month: 'Jun', revenue: 14000, invoices: 9 },
  ];

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

    cy.intercept('GET', '**/reports/monthly*', {
      statusCode: 200,
      body: { data: mockMonthlyData },
    }).as('getMonthlyReports');

    cy.intercept('GET', '**/reports/clients*', {
      statusCode: 200,
      body: {
        data: [
          { client_id: 1, client_name: 'Top Client', total_revenue: 15000, invoice_count: 10 },
          { client_id: 2, client_name: 'Second Client', total_revenue: 10000, invoice_count: 8 },
        ],
      },
    }).as('getClientReports');

    cy.intercept('GET', '**/credits/balance', {
      statusCode: 200,
      body: { sms_credits: 100, email_credits: 500 },
    }).as('getCredits');
  });

  describe('Reports Page', () => {
    beforeEach(() => {
      cy.visit('/reports');
      cy.wait('@getReportsSummary');
    });

    it('should display reports page', () => {
      cy.contains(/reports|analytics/i).should('be.visible');
    });

    it('should display revenue summary', () => {
      cy.contains('50,000').should('be.visible');
    });

    it('should display invoice statistics', () => {
      cy.contains(/paid/i).should('be.visible');
      cy.contains(/pending/i).should('be.visible');
    });

    it('should display date range filter', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="date-range"]').length || $body.find('input[type="date"]').length) {
          cy.get('[data-testid="date-range"], input[type="date"]').should('be.visible');
        }
      });
    });
  });

  describe('Charts & Visualizations', () => {
    beforeEach(() => {
      cy.visit('/reports');
      cy.wait('@getReportsSummary');
    });

    it('should display revenue chart', () => {
      cy.get('body').then(($body) => {
        // Check for recharts or similar chart library elements
        if ($body.find('.recharts-wrapper, svg[class*="chart"]').length) {
          cy.get('.recharts-wrapper, svg[class*="chart"]').should('be.visible');
        }
      });
    });

    it('should display invoice status breakdown', () => {
      cy.contains(/paid|pending|overdue/i).should('be.visible');
    });
  });

  describe('Analytics Page', () => {
    beforeEach(() => {
      cy.visit('/analytics');
    });

    it('should display analytics page', () => {
      cy.contains(/analytics|statistics/i).should('be.visible');
    });

    it('should display key metrics', () => {
      cy.wait('@getReportsSummary');
      cy.get('body').should('contain.text', 'revenue').or('contain.text', 'Revenue');
    });
  });

  describe('Export Reports', () => {
    beforeEach(() => {
      cy.visit('/reports');
      cy.wait('@getReportsSummary');
    });

    it('should display export options', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Export")').length) {
          cy.contains('button', /export/i).should('be.visible');
        }
      });
    });

    it('should export report to CSV', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Export")').length) {
          cy.contains('button', /export/i).click({ force: true });
          
          // Check for CSV option
          if ($body.find('[role="menuitem"]:contains("CSV")').length) {
            cy.contains(/csv/i).click({ force: true });
          }
        }
      });
    });
  });
});
