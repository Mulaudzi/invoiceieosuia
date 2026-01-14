// Cypress E2E Support File
import './commands';

// Prevent Cypress from failing on uncaught exceptions
Cypress.on('uncaught:exception', (err) => {
  // Return false to prevent the error from failing the test
  // This is useful for third-party scripts that might throw errors
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
  if (err.message.includes('Script error')) {
    return false;
  }
  return true;
});

// Log API requests for debugging
Cypress.on('log:added', (log) => {
  if (log.displayName === 'xhr' || log.displayName === 'fetch') {
    console.log(`${log.displayName}: ${log.message}`);
  }
});

beforeEach(() => {
  // Clear localStorage before each test to ensure clean state
  cy.clearLocalStorage();
  cy.clearCookies();
});
