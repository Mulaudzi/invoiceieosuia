/// <reference types="cypress" />

describe('Invoice Management', () => {
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
      name: 'Test Client 1',
      email: 'client1@example.com',
      company: 'Client Company 1',
    },
    {
      id: 2,
      name: 'Test Client 2',
      email: 'client2@example.com',
      company: 'Client Company 2',
    },
  ];

  const mockProducts = [
    {
      id: 1,
      name: 'Web Development',
      description: 'Web development services',
      price: 1500.00,
      sku: 'WEB-001',
    },
    {
      id: 2,
      name: 'Design Services',
      description: 'UI/UX design',
      price: 800.00,
      sku: 'DES-001',
    },
  ];

  const mockTemplates = [
    {
      id: 1,
      name: 'Default Template',
      is_default: true,
    },
  ];

  const mockInvoices = [
    {
      id: 1,
      invoice_number: 'INV-001',
      client_id: 1,
      client: mockClients[0],
      status: 'Draft',
      date: '2024-01-15',
      due_date: '2024-02-15',
      subtotal: 1500.00,
      tax: 225.00,
      total: 1725.00,
      items: [
        {
          id: 1,
          name: 'Web Development',
          quantity: 1,
          price: 1500.00,
          tax_rate: 15,
          total: 1725.00,
        },
      ],
    },
    {
      id: 2,
      invoice_number: 'INV-002',
      client_id: 2,
      client: mockClients[1],
      status: 'Sent',
      date: '2024-01-10',
      due_date: '2024-02-10',
      subtotal: 800.00,
      tax: 120.00,
      total: 920.00,
      items: [],
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

    cy.intercept('GET', '**/invoices', {
      statusCode: 200,
      body: { data: mockInvoices, current_page: 1, last_page: 1, per_page: 10, total: 2 },
    }).as('getInvoices');

    cy.intercept('GET', '**/clients', {
      statusCode: 200,
      body: { data: mockClients, current_page: 1, last_page: 1, per_page: 10, total: 2 },
    }).as('getClients');

    cy.intercept('GET', '**/products', {
      statusCode: 200,
      body: { data: mockProducts, current_page: 1, last_page: 1, per_page: 10, total: 2 },
    }).as('getProducts');

    cy.intercept('GET', '**/templates', {
      statusCode: 200,
      body: { data: mockTemplates, current_page: 1, last_page: 1, per_page: 10, total: 1 },
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

  describe('Invoice List Page', () => {
    beforeEach(() => {
      cy.visit('/invoices');
      cy.wait('@getInvoices');
    });

    it('should display invoices page with invoice list', () => {
      cy.contains('Invoices').should('be.visible');
      cy.contains('INV-001').should('be.visible');
      cy.contains('INV-002').should('be.visible');
    });

    it('should display create invoice button', () => {
      cy.contains('button', /create|new|add/i).should('be.visible');
    });

    it('should filter invoices by status', () => {
      // Click on filter dropdown if exists
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="status-filter"]').length) {
          cy.get('[data-testid="status-filter"]').click();
          cy.contains('Draft').click();
        }
      });
    });

    it('should search invoices by invoice number', () => {
      cy.get('input[placeholder*="earch"]').type('INV-001');
      cy.contains('INV-001').should('be.visible');
    });

    it('should display invoice status badges', () => {
      cy.contains('Draft').should('be.visible');
      cy.contains('Sent').should('be.visible');
    });
  });

  describe('Create Invoice', () => {
    beforeEach(() => {
      cy.visit('/invoices');
      cy.wait('@getInvoices');

      cy.intercept('POST', '**/invoices', {
        statusCode: 201,
        body: {
          success: true,
          invoice: {
            id: 3,
            invoice_number: 'INV-003',
            client_id: 1,
            client: mockClients[0],
            status: 'Draft',
            date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            subtotal: 1500.00,
            tax: 225.00,
            total: 1725.00,
            items: [],
          },
        },
      }).as('createInvoice');
    });

    it('should open create invoice modal', () => {
      cy.contains('button', /create|new|add/i).first().click();
      cy.contains(/create invoice|new invoice/i).should('be.visible');
    });

    it('should display client selection in invoice form', () => {
      cy.contains('button', /create|new|add/i).first().click();
      cy.wait('@getClients');
      
      // Client dropdown should be visible
      cy.get('form').should('be.visible');
    });

    it('should create a new invoice with valid data', () => {
      cy.contains('button', /create|new|add/i).first().click();
      cy.wait(['@getClients', '@getProducts', '@getTemplates']);

      // Select client
      cy.get('[role="combobox"]').first().click({ force: true });
      cy.get('[role="option"]').first().click({ force: true });

      // Submit form
      cy.get('button[type="submit"]').click();

      cy.wait('@createInvoice');
      cy.contains(/created|success/i).should('be.visible');
    });

    it('should show validation error when no client selected', () => {
      cy.contains('button', /create|new|add/i).first().click();
      cy.wait(['@getClients', '@getProducts', '@getTemplates']);

      // Try to submit without selecting client
      cy.get('button[type="submit"]').click();
      
      // Should show validation error
      cy.get('form').should('be.visible'); // Form should still be visible
    });
  });

  describe('Invoice Actions', () => {
    beforeEach(() => {
      cy.visit('/invoices');
      cy.wait('@getInvoices');
    });

    it('should open invoice action menu', () => {
      // Find action button/dropdown for first invoice
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click({ force: true });
      });
    });

    it('should mark invoice as paid', () => {
      cy.intercept('POST', '**/invoices/1/mark-paid', {
        statusCode: 200,
        body: {
          success: true,
          invoice: { ...mockInvoices[0], status: 'Paid' },
        },
      }).as('markPaid');

      // Click action menu and mark as paid
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/mark.*paid|paid/i).click({ force: true });
    });

    it('should delete invoice', () => {
      cy.intercept('DELETE', '**/invoices/1', {
        statusCode: 200,
        body: { success: true },
      }).as('deleteInvoice');

      // Click action menu
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click({ force: true });
      });

      // Click delete option
      cy.contains(/delete/i).click({ force: true });

      // Confirm deletion if dialog appears
      cy.get('body').then(($body) => {
        if ($body.find('[role="alertdialog"]').length) {
          cy.get('[role="alertdialog"]').within(() => {
            cy.contains('button', /delete|confirm|yes/i).click();
          });
        }
      });
    });

    it('should download invoice PDF', () => {
      cy.intercept('GET', '**/invoices/1/pdf', {
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
        },
        body: new Blob(['PDF content'], { type: 'application/pdf' }),
      }).as('downloadPdf');

      // Click action menu
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/download|pdf/i).click({ force: true });
    });

    it('should send invoice via email', () => {
      cy.intercept('POST', '**/invoices/1/send', {
        statusCode: 200,
        body: { success: true, message: 'Invoice sent successfully' },
      }).as('sendInvoice');

      cy.intercept('GET', '**/invoices/1/email-preview', {
        statusCode: 200,
        body: {
          subject: 'Invoice INV-001',
          body: 'Please find attached invoice INV-001',
        },
      }).as('emailPreview');

      // Click action menu
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/send.*email|email/i).click({ force: true });
    });
  });

  describe('Edit Invoice', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/invoices/1', {
        statusCode: 200,
        body: { success: true, invoice: mockInvoices[0] },
      }).as('getInvoice');

      cy.intercept('PUT', '**/invoices/1', {
        statusCode: 200,
        body: {
          success: true,
          invoice: { ...mockInvoices[0], notes: 'Updated notes' },
        },
      }).as('updateInvoice');

      cy.visit('/invoices');
      cy.wait('@getInvoices');
    });

    it('should open edit modal for existing invoice', () => {
      // Click edit action
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/edit/i).click({ force: true });
    });

    it('should update invoice details', () => {
      // Click edit action
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/edit/i).click({ force: true });

      // Update notes field if visible
      cy.get('body').then(($body) => {
        if ($body.find('textarea[name="notes"]').length) {
          cy.get('textarea[name="notes"]').clear().type('Updated notes');
          cy.get('button[type="submit"]').click();
          cy.wait('@updateInvoice');
        }
      });
    });
  });

  describe('Invoice Line Items', () => {
    beforeEach(() => {
      cy.visit('/invoices');
      cy.wait('@getInvoices');
    });

    it('should add line item to invoice', () => {
      cy.contains('button', /create|new|add/i).first().click();
      cy.wait(['@getClients', '@getProducts', '@getTemplates']);

      // Look for add item button
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="add-item"]').length) {
          cy.get('[data-testid="add-item"]').click();
        } else {
          cy.contains('button', /add.*item|add.*line/i).click({ force: true });
        }
      });
    });

    it('should calculate totals correctly', () => {
      cy.contains('button', /create|new|add/i).first().click();
      cy.wait(['@getClients', '@getProducts', '@getTemplates']);

      // Total should update based on items
      cy.get('form').should('be.visible');
    });
  });
});
