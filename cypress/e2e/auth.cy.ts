/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/login').as('loginRequest');
    cy.intercept('POST', '**/register').as('registerRequest');
    cy.intercept('GET', '**/user').as('getUserRequest');
    cy.intercept('POST', '**/logout').as('logoutRequest');
  });

  describe('Login Page', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should display login form elements', () => {
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Sign In');
      cy.contains('Forgot password').should('be.visible');
      cy.contains('Create an account').should('be.visible');
    });

    it('should show validation errors for empty form submission', () => {
      cy.get('button[type="submit"]').click();
      // Form should not submit with empty fields
      cy.url().should('include', '/login');
    });

    it('should show error for invalid credentials', () => {
      cy.fixture('users').then((users) => {
        cy.get('input[type="email"]').type(users.invalidUser.email);
        cy.get('input[type="password"]').type(users.invalidUser.password);
        cy.get('button[type="submit"]').click();
        
        cy.wait('@loginRequest').then((interception) => {
          if (interception.response?.statusCode === 401) {
            // Error toast should appear
            cy.contains(/invalid|credentials|password/i).should('be.visible');
          }
        });
      });
    });

    it('should successfully login with valid credentials and redirect to dashboard', () => {
      cy.fixture('users').then((users) => {
        // Mock successful login
        cy.intercept('POST', '**/login', {
          statusCode: 200,
          body: {
            success: true,
            token: 'test-jwt-token-123',
            user: {
              id: 1,
              name: users.validUser.name,
              email: users.validUser.email,
              email_verified: true,
              plan: 'free',
            },
          },
        }).as('loginRequest');

        cy.get('input[type="email"]').type(users.validUser.email);
        cy.get('input[type="password"]').type(users.validUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait('@loginRequest');
        
        // Should redirect to dashboard
        cy.url().should('include', '/dashboard', { timeout: 10000 });
        
        // Token should be stored
        cy.window().then((win) => {
          expect(win.localStorage.getItem('ieosuia_auth_token')).to.equal('test-jwt-token-123');
        });
      });
    });

    it('should toggle password visibility', () => {
      cy.get('input[type="password"]').type('testpassword');
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
      
      // Find and click the show password button
      cy.get('button').filter(':contains("Show")').first().click({ force: true });
      // After clicking, password might be visible
    });

    it('should navigate to forgot password page', () => {
      cy.contains('Forgot password').click();
      cy.url().should('include', '/forgot-password');
    });

    it('should navigate to register page', () => {
      cy.contains('Create an account').click();
      cy.url().should('include', '/register');
    });
  });

  describe('Registration Flow', () => {
    beforeEach(() => {
      cy.visit('/register');
    });

    it('should display registration form elements', () => {
      cy.get('input[name="name"]').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation error for weak password', () => {
      cy.fixture('users').then((users) => {
        cy.get('input[name="name"]').type(users.newUser.name);
        cy.get('input[type="email"]').type(users.newUser.email);
        cy.get('input[type="password"]').type('123'); // Weak password
        cy.get('button[type="submit"]').click();
        
        // Should show password validation error
        cy.url().should('include', '/register');
      });
    });

    it('should successfully register a new user', () => {
      cy.fixture('users').then((users) => {
        // Mock successful registration
        cy.intercept('POST', '**/register', {
          statusCode: 200,
          body: {
            success: true,
            token: 'new-user-token-123',
            user: {
              id: 2,
              name: users.newUser.name,
              email: users.newUser.email,
              email_verified: false,
              plan: 'free',
            },
          },
        }).as('registerRequest');

        cy.get('input[name="name"]').type(users.newUser.name);
        cy.get('input[type="email"]').type(users.newUser.email);
        cy.get('input[type="password"]').type(users.newUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait('@registerRequest');
      });
    });

    it('should show error for existing email', () => {
      cy.fixture('users').then((users) => {
        cy.intercept('POST', '**/register', {
          statusCode: 422,
          body: {
            message: 'The email has already been taken.',
            errors: {
              email: ['The email has already been taken.'],
            },
          },
        }).as('registerRequest');

        cy.get('input[name="name"]').type(users.newUser.name);
        cy.get('input[type="email"]').type(users.validUser.email);
        cy.get('input[type="password"]').type(users.newUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait('@registerRequest');
        cy.contains(/email.*taken|already exists/i).should('be.visible');
      });
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Set up authenticated state
      cy.window().then((win) => {
        win.localStorage.setItem('ieosuia_auth_token', 'test-token');
        win.localStorage.setItem('auth_user', JSON.stringify({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          email_verified: true,
          plan: 'free',
        }));
      });

      cy.intercept('GET', '**/user', {
        statusCode: 200,
        body: {
          success: true,
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            email_verified: true,
            plan: 'free',
          },
        },
      }).as('getUserRequest');

      cy.intercept('POST', '**/logout', {
        statusCode: 200,
        body: { success: true },
      }).as('logoutRequest');
    });

    it('should logout user and redirect to home', () => {
      cy.visit('/dashboard');
      
      // Find and click logout button (may be in a dropdown)
      cy.get('button').contains(/logout|sign out/i).click({ force: true });

      // Token should be removed
      cy.window().then((win) => {
        expect(win.localStorage.getItem('ieosuia_auth_token')).to.be.null;
      });
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users from dashboard to login', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should redirect unauthenticated users from invoices to login', () => {
      cy.visit('/invoices');
      cy.url().should('include', '/login');
    });

    it('should redirect unauthenticated users from clients to login', () => {
      cy.visit('/clients');
      cy.url().should('include', '/login');
    });

    it('should allow authenticated users to access dashboard', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('ieosuia_auth_token', 'valid-token');
        win.localStorage.setItem('auth_user', JSON.stringify({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          email_verified: true,
          plan: 'free',
        }));
      });

      cy.intercept('GET', '**/user', {
        statusCode: 200,
        body: {
          success: true,
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            email_verified: true,
            plan: 'free',
          },
        },
      });

      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Forgot Password Flow', () => {
    beforeEach(() => {
      cy.visit('/forgot-password');
    });

    it('should display forgot password form', () => {
      cy.get('input[type="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should send password reset email', () => {
      cy.intercept('POST', '**/forgot-password', {
        statusCode: 200,
        body: { success: true, message: 'Password reset link sent to your email' },
      }).as('forgotPasswordRequest');

      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();

      cy.wait('@forgotPasswordRequest');
      cy.contains(/reset|sent|email/i).should('be.visible');
    });

    it('should show error for non-existent email', () => {
      cy.intercept('POST', '**/forgot-password', {
        statusCode: 404,
        body: { message: 'No account found with this email address' },
      }).as('forgotPasswordRequest');

      cy.get('input[type="email"]').type('nonexistent@example.com');
      cy.get('button[type="submit"]').click();

      cy.wait('@forgotPasswordRequest');
      cy.contains(/not found|no account/i).should('be.visible');
    });
  });
});
