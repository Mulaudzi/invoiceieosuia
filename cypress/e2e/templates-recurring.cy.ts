/// <reference types="cypress" />

describe('Templates Management', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified: true,
    plan: 'professional',
  };

  const mockTemplates = [
    {
      id: 1,
      name: 'Default Invoice',
      description: 'Standard invoice template',
      is_default: true,
      content: '<div>Invoice Template</div>',
    },
    {
      id: 2,
      name: 'Professional Invoice',
      description: 'Professional looking invoice',
      is_default: false,
      content: '<div>Professional Template</div>',
    },
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

    cy.intercept('GET', '**/templates', {
      statusCode: 200,
      body: { data: mockTemplates, current_page: 1, last_page: 1, per_page: 10, total: 2 },
    }).as('getTemplates');

    cy.intercept('GET', '**/reports/summary*', {
      statusCode: 200,
      body: {
        total_revenue: 10000,
        outstanding_amount: 2000,
        paid_invoices: 8,
        pending_invoices: 2,
      },
    }).as('getReportsSummary');

    cy.intercept('GET', '**/credits/balance', {
      statusCode: 200,
      body: { sms_credits: 100, email_credits: 500 },
    }).as('getCredits');
  });

  describe('Templates List', () => {
    beforeEach(() => {
      cy.visit('/templates');
      cy.wait('@getTemplates');
    });

    it('should display templates page', () => {
      cy.contains(/templates/i).should('be.visible');
    });

    it('should display template list', () => {
      cy.contains('Default Invoice').should('be.visible');
      cy.contains('Professional Invoice').should('be.visible');
    });

    it('should show default template indicator', () => {
      cy.contains(/default/i).should('be.visible');
    });
  });

  describe('Template Actions', () => {
    beforeEach(() => {
      cy.visit('/templates');
      cy.wait('@getTemplates');

      cy.intercept('POST', '**/templates/2/set-default', {
        statusCode: 200,
        body: {
          success: true,
          template: { ...mockTemplates[1], is_default: true },
        },
      }).as('setDefault');

      cy.intercept('DELETE', '**/templates/2', {
        statusCode: 200,
        body: { success: true },
      }).as('deleteTemplate');
    });

    it('should set template as default', () => {
      cy.contains('Professional Invoice').parents('[class*="card"], tr').within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/set.*default|make.*default/i).click({ force: true });
      cy.wait('@setDefault');
    });

    it('should delete template', () => {
      cy.contains('Professional Invoice').parents('[class*="card"], tr').within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/delete/i).click({ force: true });

      cy.get('body').then(($body) => {
        if ($body.find('[role="alertdialog"]').length) {
          cy.get('[role="alertdialog"]').within(() => {
            cy.contains('button', /delete|confirm|yes/i).click();
          });
        }
      });
    });
  });

  describe('Email Templates', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/message-templates', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              name: 'Invoice Email',
              type: 'email',
              subject: 'Your Invoice',
              body: 'Please find attached your invoice.',
            },
          ],
        },
      }).as('getMessageTemplates');

      cy.visit('/email-templates');
    });

    it('should display email templates page', () => {
      cy.contains(/email.*template/i).should('be.visible');
    });
  });
});

describe('Recurring Invoices', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified: true,
    plan: 'professional',
  };

  const mockRecurringInvoices = [
    {
      id: 1,
      client_id: 1,
      client: { id: 1, name: 'Monthly Client', email: 'monthly@client.com' },
      frequency: 'monthly',
      next_run: '2024-02-01',
      status: 'active',
      total: 1500,
    },
  ];

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('ieosuia_auth_token', 'test-token');
      win.localStorage.setItem('auth_user', JSON.stringify(mockUser));
    });

    cy.intercept('GET', '**/user', {
      statusCode: 200,
      body: { success: true, user: mockUser },
    }).as('getUser');

    cy.intercept('GET', '**/recurring-invoices', {
      statusCode: 200,
      body: { data: mockRecurringInvoices, current_page: 1, last_page: 1, per_page: 10, total: 1 },
    }).as('getRecurringInvoices');

    cy.intercept('GET', '**/reports/summary*', {
      statusCode: 200,
      body: {
        total_revenue: 10000,
        outstanding_amount: 2000,
      },
    }).as('getReportsSummary');

    cy.intercept('GET', '**/credits/balance', {
      statusCode: 200,
      body: { sms_credits: 100, email_credits: 500 },
    }).as('getCredits');
  });

  describe('Recurring Invoices List', () => {
    beforeEach(() => {
      cy.visit('/recurring-invoices');
      cy.wait('@getRecurringInvoices');
    });

    it('should display recurring invoices page', () => {
      cy.contains(/recurring/i).should('be.visible');
    });

    it('should display recurring invoice list', () => {
      cy.contains('Monthly Client').should('be.visible');
      cy.contains(/monthly/i).should('be.visible');
    });
  });
});

describe('Reminders', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified: true,
    plan: 'professional',
  };

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('ieosuia_auth_token', 'test-token');
      win.localStorage.setItem('auth_user', JSON.stringify(mockUser));
    });

    cy.intercept('GET', '**/user', {
      statusCode: 200,
      body: { success: true, user: mockUser },
    }).as('getUser');

    cy.intercept('GET', '**/reminders', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 1,
            invoice_id: 1,
            scheduled_at: '2024-02-01',
            status: 'pending',
            type: 'email',
          },
        ],
      },
    }).as('getReminders');

    cy.intercept('GET', '**/reports/summary*', {
      statusCode: 200,
      body: {
        total_revenue: 10000,
        outstanding_amount: 2000,
      },
    }).as('getReportsSummary');

    cy.intercept('GET', '**/credits/balance', {
      statusCode: 200,
      body: { sms_credits: 100, email_credits: 500 },
    }).as('getCredits');
  });

  describe('Reminders Page', () => {
    beforeEach(() => {
      cy.visit('/reminders');
    });

    it('should display reminders page', () => {
      cy.contains(/reminder/i).should('be.visible');
    });
  });
});
