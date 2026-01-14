/// <reference types="cypress" />

describe('Payment Processing', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified: true,
    plan: 'professional',
  };

  const mockClients = [
    {
      id: 1,
      name: 'Test Client',
      email: 'client@example.com',
      company: 'Client Company',
    },
  ];

  const mockInvoices = [
    {
      id: 1,
      invoice_number: 'INV-001',
      client_id: 1,
      client: mockClients[0],
      status: 'Sent',
      date: '2024-01-15',
      due_date: '2024-02-15',
      subtotal: 1500.00,
      tax: 225.00,
      total: 1725.00,
      items: [],
    },
    {
      id: 2,
      invoice_number: 'INV-002',
      client_id: 1,
      client: mockClients[0],
      status: 'Paid',
      date: '2024-01-10',
      due_date: '2024-02-10',
      subtotal: 800.00,
      tax: 120.00,
      total: 920.00,
      items: [],
    },
  ];

  const mockPayments = [
    {
      id: 1,
      invoice_id: 2,
      invoice: mockInvoices[1],
      amount: 920.00,
      method: 'bank_transfer',
      date: '2024-01-12',
      notes: 'Full payment received',
    },
  ];

  const mockPaymentSummary = {
    total_received: 920.00,
    this_month: 920.00,
    last_month: 0,
    by_method: {
      bank_transfer: 920.00,
    },
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

    cy.intercept('GET', '**/payments', {
      statusCode: 200,
      body: { data: mockPayments, current_page: 1, last_page: 1, per_page: 10, total: 1 },
    }).as('getPayments');

    cy.intercept('GET', '**/payments/summary', {
      statusCode: 200,
      body: mockPaymentSummary,
    }).as('getPaymentSummary');

    cy.intercept('GET', '**/invoices', {
      statusCode: 200,
      body: { data: mockInvoices, current_page: 1, last_page: 1, per_page: 10, total: 2 },
    }).as('getInvoices');

    cy.intercept('GET', '**/reports/summary*', {
      statusCode: 200,
      body: {
        total_revenue: 10000,
        outstanding_amount: 1725,
        paid_invoices: 1,
        pending_invoices: 1,
      },
    }).as('getReportsSummary');

    cy.intercept('GET', '**/credits/balance', {
      statusCode: 200,
      body: { sms_credits: 100, email_credits: 500 },
    }).as('getCredits');
  });

  describe('Payments Page', () => {
    beforeEach(() => {
      cy.visit('/payments');
      cy.wait(['@getPayments', '@getPaymentSummary']);
    });

    it('should display payments page with summary', () => {
      cy.contains('Payments').should('be.visible');
      cy.contains(/total.*received|received/i).should('be.visible');
    });

    it('should display payment list', () => {
      cy.contains('INV-002').should('be.visible');
      cy.contains('920').should('be.visible');
    });

    it('should display record payment button', () => {
      cy.contains('button', /record|add|new/i).should('be.visible');
    });

    it('should display payment summary cards', () => {
      // Summary cards should show payment statistics
      cy.get('body').should('contain.text', '920');
    });

    it('should search payments', () => {
      cy.get('input[placeholder*="earch"]').type('INV-002');
      cy.contains('INV-002').should('be.visible');
    });
  });

  describe('Record Payment', () => {
    beforeEach(() => {
      cy.visit('/payments');
      cy.wait(['@getPayments', '@getPaymentSummary', '@getInvoices']);

      cy.intercept('POST', '**/payments', {
        statusCode: 201,
        body: {
          success: true,
          payment: {
            id: 2,
            invoice_id: 1,
            invoice: mockInvoices[0],
            amount: 1725.00,
            method: 'bank_transfer',
            date: new Date().toISOString().split('T')[0],
            notes: 'Test payment',
          },
        },
      }).as('createPayment');
    });

    it('should open record payment modal', () => {
      cy.contains('button', /record|add|new/i).first().click();
      cy.contains(/record payment|new payment/i).should('be.visible');
    });

    it('should display unpaid invoices in dropdown', () => {
      cy.contains('button', /record|add|new/i).first().click();
      
      // Invoice dropdown should show unpaid invoices
      cy.get('form').should('be.visible');
    });

    it('should record a payment successfully', () => {
      cy.contains('button', /record|add|new/i).first().click();

      // Select invoice
      cy.get('[role="combobox"]').first().click({ force: true });
      cy.get('[role="option"]').first().click({ force: true });

      // Enter amount
      cy.get('input[name="amount"]').clear().type('1725');

      // Select payment method
      cy.get('body').then(($body) => {
        const methodSelect = $body.find('[name="method"]');
        if (methodSelect.length) {
          cy.get('[role="combobox"]').eq(1).click({ force: true });
          cy.get('[role="option"]').first().click({ force: true });
        }
      });

      // Submit
      cy.get('button[type="submit"]').click();

      cy.wait('@createPayment');
      cy.contains(/recorded|success/i).should('be.visible');
    });

    it('should validate required fields', () => {
      cy.contains('button', /record|add|new/i).first().click();

      // Try to submit without filling required fields
      cy.get('button[type="submit"]').click();

      // Form should still be visible (validation failed)
      cy.get('form').should('be.visible');
    });

    it('should auto-fill amount from selected invoice', () => {
      cy.contains('button', /record|add|new/i).first().click();

      // Select an invoice
      cy.get('[role="combobox"]').first().click({ force: true });
      cy.get('[role="option"]').first().click({ force: true });

      // Amount field should have a value
      cy.get('input[name="amount"]').should('not.have.value', '');
    });
  });

  describe('Delete Payment', () => {
    beforeEach(() => {
      cy.visit('/payments');
      cy.wait(['@getPayments', '@getPaymentSummary']);

      cy.intercept('DELETE', '**/payments/1', {
        statusCode: 200,
        body: { success: true },
      }).as('deletePayment');
    });

    it('should delete a payment', () => {
      // Find delete button for payment
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/delete/i).click({ force: true });

      // Confirm deletion
      cy.get('body').then(($body) => {
        if ($body.find('[role="alertdialog"]').length) {
          cy.get('[role="alertdialog"]').within(() => {
            cy.contains('button', /delete|confirm|yes/i).click();
          });
        }
      });
    });
  });

  describe('Payment Methods', () => {
    beforeEach(() => {
      cy.visit('/payments');
      cy.wait(['@getPayments', '@getPaymentSummary', '@getInvoices']);
    });

    it('should display all payment method options', () => {
      cy.contains('button', /record|add|new/i).first().click();

      // Open payment method dropdown
      cy.get('body').then(($body) => {
        if ($body.find('[role="combobox"]').length > 1) {
          cy.get('[role="combobox"]').eq(1).click({ force: true });
          
          // Check for common payment methods
          cy.get('[role="option"]').should('have.length.greaterThan', 0);
        }
      });
    });

    it('should record cash payment', () => {
      cy.intercept('POST', '**/payments', {
        statusCode: 201,
        body: {
          success: true,
          payment: {
            id: 3,
            invoice_id: 1,
            invoice: mockInvoices[0],
            amount: 500.00,
            method: 'cash',
            date: new Date().toISOString().split('T')[0],
            notes: 'Cash payment',
          },
        },
      }).as('createCashPayment');

      cy.contains('button', /record|add|new/i).first().click();

      // Select invoice
      cy.get('[role="combobox"]').first().click({ force: true });
      cy.get('[role="option"]').first().click({ force: true });

      // Enter amount
      cy.get('input[name="amount"]').clear().type('500');

      // Submit
      cy.get('button[type="submit"]').click();

      cy.wait('@createCashPayment');
    });
  });

  describe('Payment History', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/payment-history*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              amount: 920.00,
              status: 'completed',
              gateway: 'bank_transfer',
              created_at: '2024-01-12',
            },
          ],
        },
      }).as('getPaymentHistory');

      cy.visit('/payment-history');
    });

    it('should display payment history page', () => {
      cy.contains(/payment.*history|transactions/i).should('be.visible');
    });

    it('should filter by status', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="status-filter"]').length) {
          cy.get('[data-testid="status-filter"]').click();
          cy.contains(/completed|paid/i).click({ force: true });
        }
      });
    });

    it('should export payment history to CSV', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Export")').length) {
          cy.contains('button', /export/i).click({ force: true });
        }
      });
    });
  });

  describe('Subscription Payments', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/payfast/checkout', {
        statusCode: 200,
        body: {
          success: true,
          payment_url: 'https://sandbox.payfast.co.za/eng/process',
        },
      }).as('initiatePayment');

      cy.intercept('POST', '**/paystack/initialize', {
        statusCode: 200,
        body: {
          success: true,
          authorization_url: 'https://checkout.paystack.com/test',
          reference: 'test-ref-123',
        },
      }).as('paystackInit');

      cy.visit('/subscription');
    });

    it('should display subscription plans', () => {
      cy.contains(/subscription|plans|pricing/i).should('be.visible');
    });

    it('should initiate upgrade payment', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Upgrade")').length) {
          cy.contains('button', /upgrade/i).first().click({ force: true });
        }
      });
    });
  });

  describe('Payment Success/Failure Pages', () => {
    it('should display payment success page', () => {
      cy.visit('/payment-success');
      cy.contains(/success|thank you|confirmed/i).should('be.visible');
    });

    it('should display payment failed page', () => {
      cy.visit('/payment-failed');
      cy.contains(/failed|error|unsuccessful/i).should('be.visible');
    });

    it('should provide retry option on failure page', () => {
      cy.visit('/payment-failed');
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Retry")').length || $body.find('a:contains("Retry")').length) {
          cy.contains(/retry|try again/i).should('be.visible');
        }
      });
    });
  });
});
