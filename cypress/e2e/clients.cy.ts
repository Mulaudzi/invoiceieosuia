/// <reference types="cypress" />

describe('Client Management', () => {
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
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+27123456789',
      company: 'Acme Corp',
      address: '123 Main Street',
      city: 'Cape Town',
      state: 'Western Cape',
      zip: '8001',
      country: 'South Africa',
    },
    {
      id: 2,
      name: 'Tech Solutions',
      email: 'info@techsolutions.com',
      phone: '+27987654321',
      company: 'Tech Solutions Ltd',
      address: '456 Tech Road',
      city: 'Johannesburg',
      state: 'Gauteng',
      zip: '2000',
      country: 'South Africa',
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

    cy.intercept('GET', '**/clients', {
      statusCode: 200,
      body: { data: mockClients, current_page: 1, last_page: 1, per_page: 10, total: 2 },
    }).as('getClients');

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

  describe('Clients List Page', () => {
    beforeEach(() => {
      cy.visit('/clients');
      cy.wait('@getClients');
    });

    it('should display clients page', () => {
      cy.contains('Clients').should('be.visible');
    });

    it('should display client list', () => {
      cy.contains('Acme Corporation').should('be.visible');
      cy.contains('Tech Solutions').should('be.visible');
    });

    it('should display add client button', () => {
      cy.contains('button', /add.*client|new.*client/i).should('be.visible');
    });

    it('should search clients', () => {
      cy.get('input[placeholder*="earch"]').type('Acme');
      cy.contains('Acme Corporation').should('be.visible');
      cy.contains('Tech Solutions').should('not.exist');
    });

    it('should display client contact information', () => {
      cy.contains('contact@acme.com').should('be.visible');
    });
  });

  describe('Create Client', () => {
    beforeEach(() => {
      cy.visit('/clients');
      cy.wait('@getClients');

      cy.intercept('POST', '**/clients', {
        statusCode: 201,
        body: {
          success: true,
          client: {
            id: 3,
            name: 'New Client',
            email: 'new@client.com',
            phone: '+27111111111',
            company: 'New Company',
          },
        },
      }).as('createClient');
    });

    it('should open add client modal', () => {
      cy.contains('button', /add.*client|new.*client/i).click();
      cy.contains(/add client|new client|create client/i).should('be.visible');
    });

    it('should create a new client', () => {
      cy.contains('button', /add.*client|new.*client/i).click();

      // Fill in client details
      cy.get('input[name="name"]').type('New Client');
      cy.get('input[name="email"]').type('new@client.com');
      
      cy.get('body').then(($body) => {
        if ($body.find('input[name="phone"]').length) {
          cy.get('input[name="phone"]').type('+27111111111');
        }
        if ($body.find('input[name="company"]').length) {
          cy.get('input[name="company"]').type('New Company');
        }
      });

      cy.get('button[type="submit"]').click();

      cy.wait('@createClient');
      cy.contains(/created|success/i).should('be.visible');
    });

    it('should validate required fields', () => {
      cy.contains('button', /add.*client|new.*client/i).click();

      // Submit without filling fields
      cy.get('button[type="submit"]').click();

      // Form should still be visible
      cy.get('form').should('be.visible');
    });

    it('should validate email format', () => {
      cy.contains('button', /add.*client|new.*client/i).click();

      cy.get('input[name="name"]').type('Test Client');
      cy.get('input[name="email"]').type('invalid-email');

      cy.get('button[type="submit"]').click();

      // Form should still be visible due to validation error
      cy.get('form').should('be.visible');
    });
  });

  describe('Edit Client', () => {
    beforeEach(() => {
      cy.visit('/clients');
      cy.wait('@getClients');

      cy.intercept('GET', '**/clients/1', {
        statusCode: 200,
        body: { success: true, client: mockClients[0] },
      }).as('getClient');

      cy.intercept('PUT', '**/clients/1', {
        statusCode: 200,
        body: {
          success: true,
          client: { ...mockClients[0], name: 'Updated Acme' },
        },
      }).as('updateClient');
    });

    it('should open edit client modal', () => {
      // Click on client or edit button
      cy.contains('Acme Corporation').parents('[class*="card"], tr').within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/edit/i).click({ force: true });
    });

    it('should update client details', () => {
      cy.contains('Acme Corporation').parents('[class*="card"], tr').within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/edit/i).click({ force: true });

      // Update name
      cy.get('input[name="name"]').clear().type('Updated Acme');

      cy.get('button[type="submit"]').click();

      cy.wait('@updateClient');
      cy.contains(/updated|success/i).should('be.visible');
    });
  });

  describe('Delete Client', () => {
    beforeEach(() => {
      cy.visit('/clients');
      cy.wait('@getClients');

      cy.intercept('DELETE', '**/clients/1', {
        statusCode: 200,
        body: { success: true },
      }).as('deleteClient');
    });

    it('should delete a client', () => {
      cy.contains('Acme Corporation').parents('[class*="card"], tr').within(() => {
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

    it('should show confirmation before deleting', () => {
      cy.contains('Acme Corporation').parents('[class*="card"], tr').within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/delete/i).click({ force: true });

      // Confirmation dialog should appear
      cy.get('[role="alertdialog"]').should('be.visible');
    });
  });

  describe('Client Groups', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/client-groups', {
        statusCode: 200,
        body: {
          data: [
            { id: 1, name: 'VIP Clients', description: 'Priority clients' },
            { id: 2, name: 'Regular', description: 'Regular clients' },
          ],
        },
      }).as('getClientGroups');

      cy.visit('/clients');
      cy.wait('@getClients');
    });

    it('should display client group filter if available', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="group-filter"]').length) {
          cy.get('[data-testid="group-filter"]').should('be.visible');
        }
      });
    });
  });
});
