/// <reference types="cypress" />

// Custom commands for the application

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login via API and set authentication state
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Login via UI form
       */
      loginViaUI(email: string, password: string): Chainable<void>;
      
      /**
       * Logout and clear authentication state
       */
      logout(): Chainable<void>;
      
      /**
       * Wait for API response
       */
      waitForApi(alias: string): Chainable<void>;
      
      /**
       * Set authentication token directly
       */
      setAuthToken(token: string, user: object): Chainable<void>;
      
      /**
       * Get element by data-testid
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Create a test client
       */
      createTestClient(clientData: object): Chainable<void>;
      
      /**
       * Create a test invoice
       */
      createTestInvoice(invoiceData: object): Chainable<void>;
    }
  }
}

// Login via API
Cypress.Commands.add('login', (email: string, password: string) => {
  const apiUrl = Cypress.env('apiUrl');
  
  cy.request({
    method: 'POST',
    url: `${apiUrl}/login`,
    body: { email, password },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.token) {
      cy.window().then((win) => {
        win.localStorage.setItem('ieosuia_auth_token', response.body.token);
        win.localStorage.setItem('auth_user', JSON.stringify(response.body.user));
      });
    }
  });
});

// Login via UI
Cypress.Commands.add('loginViaUI', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
});

// Logout
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('ieosuia_auth_token');
    win.localStorage.removeItem('auth_user');
  });
  cy.clearCookies();
});

// Set auth token directly
Cypress.Commands.add('setAuthToken', (token: string, user: object) => {
  cy.window().then((win) => {
    win.localStorage.setItem('ieosuia_auth_token', token);
    win.localStorage.setItem('auth_user', JSON.stringify(user));
  });
});

// Wait for API
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(`@${alias}`).its('response.statusCode').should('be.oneOf', [200, 201]);
});

// Get by test ID
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Create test client via API
Cypress.Commands.add('createTestClient', (clientData: object) => {
  const apiUrl = Cypress.env('apiUrl');
  
  cy.window().then((win) => {
    const token = win.localStorage.getItem('ieosuia_auth_token');
    
    cy.request({
      method: 'POST',
      url: `${apiUrl}/clients`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: clientData,
    });
  });
});

// Create test invoice via API
Cypress.Commands.add('createTestInvoice', (invoiceData: object) => {
  const apiUrl = Cypress.env('apiUrl');
  
  cy.window().then((win) => {
    const token = win.localStorage.getItem('ieosuia_auth_token');
    
    cy.request({
      method: 'POST',
      url: `${apiUrl}/invoices`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: invoiceData,
    });
  });
});

export {};
