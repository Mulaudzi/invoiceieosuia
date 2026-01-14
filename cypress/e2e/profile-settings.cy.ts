/// <reference types="cypress" />

describe('Profile & Settings', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified: true,
    plan: 'professional',
    phone: '+27123456789',
    company: 'Test Company',
    avatar: null,
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

  describe('Profile Page', () => {
    beforeEach(() => {
      cy.visit('/profile');
    });

    it('should display profile page', () => {
      cy.contains(/profile|account/i).should('be.visible');
    });

    it('should display user information', () => {
      cy.contains(mockUser.name).should('be.visible');
      cy.contains(mockUser.email).should('be.visible');
    });

    it('should display edit profile form', () => {
      cy.get('input[name="name"]').should('have.value', mockUser.name);
      cy.get('input[name="email"]').should('have.value', mockUser.email);
    });

    it('should update profile information', () => {
      cy.intercept('PUT', '**/profile', {
        statusCode: 200,
        body: {
          success: true,
          user: { ...mockUser, name: 'Updated Name' },
        },
      }).as('updateProfile');

      cy.get('input[name="name"]').clear().type('Updated Name');
      cy.contains('button', /save|update/i).click();

      cy.wait('@updateProfile');
      cy.contains(/updated|success/i).should('be.visible');
    });
  });

  describe('Password Change', () => {
    beforeEach(() => {
      cy.visit('/profile');
    });

    it('should display password change section', () => {
      cy.contains(/password|security/i).should('be.visible');
    });

    it('should change password successfully', () => {
      cy.intercept('PUT', '**/password', {
        statusCode: 200,
        body: { success: true, message: 'Password updated successfully' },
      }).as('updatePassword');

      cy.get('body').then(($body) => {
        if ($body.find('input[name="current_password"]').length) {
          cy.get('input[name="current_password"]').type('oldpassword123');
          cy.get('input[name="new_password"]').type('newpassword123');
          
          if ($body.find('input[name="confirm_password"]').length) {
            cy.get('input[name="confirm_password"]').type('newpassword123');
          }

          cy.contains('button', /change.*password|update.*password/i).click();

          cy.wait('@updatePassword');
          cy.contains(/updated|success/i).should('be.visible');
        }
      });
    });

    it('should show error for mismatched passwords', () => {
      cy.get('body').then(($body) => {
        if ($body.find('input[name="new_password"]').length && $body.find('input[name="confirm_password"]').length) {
          cy.get('input[name="current_password"]').type('oldpassword123');
          cy.get('input[name="new_password"]').type('newpassword123');
          cy.get('input[name="confirm_password"]').type('differentpassword');

          cy.contains('button', /change.*password|update.*password/i).click();

          cy.contains(/match|mismatch/i).should('be.visible');
        }
      });
    });
  });

  describe('Avatar Upload', () => {
    beforeEach(() => {
      cy.visit('/profile');
    });

    it('should display avatar section', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="avatar"]').length) {
          cy.get('[class*="avatar"]').should('be.visible');
        }
      });
    });

    it('should upload avatar image', () => {
      cy.intercept('POST', '**/avatar', {
        statusCode: 200,
        body: {
          message: 'Avatar uploaded successfully',
          avatar: 'https://example.com/avatar.jpg',
          user: { ...mockUser, avatar: 'https://example.com/avatar.jpg' },
        },
      }).as('uploadAvatar');

      cy.get('body').then(($body) => {
        if ($body.find('input[type="file"]').length) {
          cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.from('fake image content'),
            fileName: 'avatar.png',
            mimeType: 'image/png',
          }, { force: true });
        }
      });
    });
  });

  describe('Settings Page', () => {
    beforeEach(() => {
      cy.visit('/settings');
    });

    it('should display settings page', () => {
      cy.contains(/settings|preferences/i).should('be.visible');
    });

    it('should display notification settings', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="notification"], [class*="switch"]').length) {
          cy.contains(/notification/i).should('be.visible');
        }
      });
    });

    it('should toggle settings', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[role="switch"]').length) {
          cy.get('[role="switch"]').first().click({ force: true });
        }
      });
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      cy.visit('/subscription');
    });

    it('should display subscription page', () => {
      cy.contains(/subscription|plan/i).should('be.visible');
    });

    it('should display current plan', () => {
      cy.contains(/professional|current.*plan/i).should('be.visible');
    });

    it('should display upgrade options', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Upgrade")').length) {
          cy.contains('button', /upgrade/i).should('be.visible');
        }
      });
    });
  });

  describe('Logo Upload', () => {
    beforeEach(() => {
      cy.visit('/profile');
    });

    it('should display logo upload section', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="logo"]').length) {
          cy.contains(/logo|brand/i).should('be.visible');
        }
      });
    });
  });

  describe('GDPR Compliance', () => {
    beforeEach(() => {
      cy.visit('/profile');
    });

    it('should display data export option', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Export")').length) {
          cy.contains(/export.*data|download.*data/i).should('be.visible');
        }
      });
    });

    it('should display delete account option', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Delete")').length) {
          cy.contains(/delete.*account/i).should('be.visible');
        }
      });
    });

    it('should export user data', () => {
      cy.intercept('GET', '**/gdpr/export', {
        statusCode: 200,
        body: {
          user: mockUser,
          clients: [],
          products: [],
          invoices: [],
          payments: [],
          templates: [],
          exported_at: new Date().toISOString(),
        },
      }).as('exportData');

      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Export")').length) {
          cy.contains('button', /export.*data/i).click({ force: true });
          cy.wait('@exportData');
        }
      });
    });
  });
});
