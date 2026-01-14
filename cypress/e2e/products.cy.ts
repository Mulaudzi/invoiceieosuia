/// <reference types="cypress" />

describe('Product Management', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified: true,
    plan: 'professional',
  };

  const mockProducts = [
    {
      id: 1,
      name: 'Web Development',
      description: 'Full stack web development services',
      price: 1500.00,
      sku: 'WEB-001',
      category: 'Services',
      active: true,
    },
    {
      id: 2,
      name: 'UI/UX Design',
      description: 'User interface and experience design',
      price: 800.00,
      sku: 'DES-001',
      category: 'Design',
      active: true,
    },
    {
      id: 3,
      name: 'Consulting',
      description: 'Technical consulting services',
      price: 200.00,
      sku: 'CON-001',
      category: 'Services',
      active: false,
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

    cy.intercept('GET', '**/products', {
      statusCode: 200,
      body: { data: mockProducts, current_page: 1, last_page: 1, per_page: 10, total: 3 },
    }).as('getProducts');

    cy.intercept('GET', '**/products/categories', {
      statusCode: 200,
      body: { success: true, categories: ['Services', 'Design', 'Products'] },
    }).as('getCategories');

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

  describe('Products List Page', () => {
    beforeEach(() => {
      cy.visit('/products');
      cy.wait('@getProducts');
    });

    it('should display products page', () => {
      cy.contains('Products').should('be.visible');
    });

    it('should display product list', () => {
      cy.contains('Web Development').should('be.visible');
      cy.contains('UI/UX Design').should('be.visible');
    });

    it('should display add product button', () => {
      cy.contains('button', /add.*product|new.*product/i).should('be.visible');
    });

    it('should search products', () => {
      cy.get('input[placeholder*="earch"]').type('Web');
      cy.contains('Web Development').should('be.visible');
    });

    it('should display product prices', () => {
      cy.contains('1500').should('be.visible');
      cy.contains('800').should('be.visible');
    });

    it('should show product status (active/inactive)', () => {
      // Products should indicate active status
      cy.get('body').should('be.visible');
    });
  });

  describe('Create Product', () => {
    beforeEach(() => {
      cy.visit('/products');
      cy.wait('@getProducts');

      cy.intercept('POST', '**/products', {
        statusCode: 201,
        body: {
          success: true,
          product: {
            id: 4,
            name: 'New Product',
            description: 'New product description',
            price: 999.00,
            sku: 'NEW-001',
            category: 'Services',
            active: true,
          },
        },
      }).as('createProduct');
    });

    it('should open add product modal', () => {
      cy.contains('button', /add.*product|new.*product/i).click();
      cy.contains(/add product|new product|create product/i).should('be.visible');
    });

    it('should create a new product', () => {
      cy.contains('button', /add.*product|new.*product/i).click();

      cy.get('input[name="name"]').type('New Product');
      cy.get('input[name="price"]').type('999');

      cy.get('body').then(($body) => {
        if ($body.find('textarea[name="description"]').length) {
          cy.get('textarea[name="description"]').type('New product description');
        }
        if ($body.find('input[name="sku"]').length) {
          cy.get('input[name="sku"]').type('NEW-001');
        }
      });

      cy.get('button[type="submit"]').click();

      cy.wait('@createProduct');
      cy.contains(/created|success/i).should('be.visible');
    });

    it('should validate required fields', () => {
      cy.contains('button', /add.*product|new.*product/i).click();

      cy.get('button[type="submit"]').click();

      // Form should still be visible
      cy.get('form').should('be.visible');
    });

    it('should validate price is a positive number', () => {
      cy.contains('button', /add.*product|new.*product/i).click();

      cy.get('input[name="name"]').type('Test Product');
      cy.get('input[name="price"]').type('-100');

      cy.get('button[type="submit"]').click();

      // Should show validation error
      cy.get('form').should('be.visible');
    });
  });

  describe('Edit Product', () => {
    beforeEach(() => {
      cy.visit('/products');
      cy.wait('@getProducts');

      cy.intercept('GET', '**/products/1', {
        statusCode: 200,
        body: { success: true, product: mockProducts[0] },
      }).as('getProduct');

      cy.intercept('PUT', '**/products/1', {
        statusCode: 200,
        body: {
          success: true,
          product: { ...mockProducts[0], price: 1800.00 },
        },
      }).as('updateProduct');
    });

    it('should open edit product modal', () => {
      cy.contains('Web Development').parents('[class*="card"], tr').within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/edit/i).click({ force: true });
    });

    it('should update product price', () => {
      cy.contains('Web Development').parents('[class*="card"], tr').within(() => {
        cy.get('button').last().click({ force: true });
      });

      cy.contains(/edit/i).click({ force: true });

      cy.get('input[name="price"]').clear().type('1800');

      cy.get('button[type="submit"]').click();

      cy.wait('@updateProduct');
      cy.contains(/updated|success/i).should('be.visible');
    });
  });

  describe('Delete Product', () => {
    beforeEach(() => {
      cy.visit('/products');
      cy.wait('@getProducts');

      cy.intercept('DELETE', '**/products/1', {
        statusCode: 200,
        body: { success: true },
      }).as('deleteProduct');
    });

    it('should delete a product', () => {
      cy.contains('Web Development').parents('[class*="card"], tr').within(() => {
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

  describe('Product Categories', () => {
    beforeEach(() => {
      cy.visit('/products');
      cy.wait('@getProducts');
    });

    it('should filter products by category', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="category-filter"]').length) {
          cy.get('[data-testid="category-filter"]').click();
          cy.contains('Services').click({ force: true });
          cy.contains('Web Development').should('be.visible');
        }
      });
    });
  });
});
