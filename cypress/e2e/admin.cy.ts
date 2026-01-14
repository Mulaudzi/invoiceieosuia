/// <reference types="cypress" />

describe('Admin Panel', () => {
  const mockAdmin = {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    is_admin: true,
  };

  beforeEach(() => {
    cy.intercept('POST', '**/admin/login', {
      statusCode: 200,
      body: {
        success: true,
        token: 'admin-token-123',
        admin: mockAdmin,
      },
    }).as('adminLogin');

    cy.intercept('GET', '**/admin/users', {
      statusCode: 200,
      body: {
        data: [
          { id: 1, name: 'User 1', email: 'user1@example.com', plan: 'free', created_at: '2024-01-01' },
          { id: 2, name: 'User 2', email: 'user2@example.com', plan: 'professional', created_at: '2024-01-02' },
        ],
        total: 2,
      },
    }).as('getUsers');

    cy.intercept('GET', '**/admin/stats', {
      statusCode: 200,
      body: {
        total_users: 100,
        total_invoices: 500,
        total_revenue: 50000,
        active_subscriptions: 25,
      },
    }).as('getAdminStats');

    cy.intercept('GET', '**/admin/subscriptions', {
      statusCode: 200,
      body: {
        data: [
          { id: 1, user_id: 1, plan: 'professional', status: 'active' },
        ],
      },
    }).as('getSubscriptions');

    cy.intercept('GET', '**/admin/activity-logs', {
      statusCode: 200,
      body: {
        data: [
          { id: 1, action: 'login', user_id: 1, created_at: '2024-01-15' },
        ],
      },
    }).as('getActivityLogs');
  });

  describe('Admin Login', () => {
    beforeEach(() => {
      cy.visit('/admin/login');
    });

    it('should display admin login page', () => {
      cy.contains(/admin.*login|login/i).should('be.visible');
    });

    it('should login as admin', () => {
      cy.get('input[type="email"]').type('admin@example.com');
      cy.get('input[type="password"]').type('adminpassword');
      cy.get('button[type="submit"]').click();

      cy.wait('@adminLogin');
    });

    it('should show error for invalid credentials', () => {
      cy.intercept('POST', '**/admin/login', {
        statusCode: 401,
        body: { message: 'Invalid credentials' },
      }).as('adminLoginFail');

      cy.get('input[type="email"]').type('wrong@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.wait('@adminLoginFail');
      cy.contains(/invalid|error/i).should('be.visible');
    });
  });

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('admin_token', 'admin-token-123');
        win.localStorage.setItem('admin_user', JSON.stringify(mockAdmin));
      });

      cy.intercept('GET', '**/admin/verify', {
        statusCode: 200,
        body: { success: true, admin: mockAdmin },
      }).as('verifyAdmin');

      cy.visit('/admin/dashboard');
    });

    it('should display admin dashboard', () => {
      cy.contains(/admin|dashboard/i).should('be.visible');
    });

    it('should display admin statistics', () => {
      cy.wait('@getAdminStats');
      cy.contains(/users|invoices|revenue/i).should('be.visible');
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('admin_token', 'admin-token-123');
        win.localStorage.setItem('admin_user', JSON.stringify(mockAdmin));
      });

      cy.intercept('GET', '**/admin/verify', {
        statusCode: 200,
        body: { success: true, admin: mockAdmin },
      }).as('verifyAdmin');

      cy.visit('/admin/users');
      cy.wait('@getUsers');
    });

    it('should display users list', () => {
      cy.contains('user1@example.com').should('be.visible');
      cy.contains('user2@example.com').should('be.visible');
    });

    it('should search users', () => {
      cy.get('input[placeholder*="earch"]').type('user1');
      cy.contains('user1@example.com').should('be.visible');
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('admin_token', 'admin-token-123');
        win.localStorage.setItem('admin_user', JSON.stringify(mockAdmin));
      });

      cy.intercept('GET', '**/admin/verify', {
        statusCode: 200,
        body: { success: true, admin: mockAdmin },
      }).as('verifyAdmin');

      cy.visit('/admin/subscriptions');
      cy.wait('@getSubscriptions');
    });

    it('should display subscriptions', () => {
      cy.contains(/subscription/i).should('be.visible');
    });
  });

  describe('Activity Logs', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('admin_token', 'admin-token-123');
        win.localStorage.setItem('admin_user', JSON.stringify(mockAdmin));
      });

      cy.intercept('GET', '**/admin/verify', {
        statusCode: 200,
        body: { success: true, admin: mockAdmin },
      }).as('verifyAdmin');

      cy.visit('/admin/activity-logs');
      cy.wait('@getActivityLogs');
    });

    it('should display activity logs', () => {
      cy.contains(/activity|log/i).should('be.visible');
    });
  });

  describe('Admin Settings', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('admin_token', 'admin-token-123');
        win.localStorage.setItem('admin_user', JSON.stringify(mockAdmin));
      });

      cy.intercept('GET', '**/admin/verify', {
        statusCode: 200,
        body: { success: true, admin: mockAdmin },
      }).as('verifyAdmin');

      cy.visit('/admin/settings');
    });

    it('should display admin settings', () => {
      cy.contains(/setting/i).should('be.visible');
    });
  });
});
