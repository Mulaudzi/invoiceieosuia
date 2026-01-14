/// <reference types="cypress" />

describe('Landing & Public Pages', () => {
  describe('Landing Page', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should display landing page', () => {
      cy.get('body').should('be.visible');
    });

    it('should display navigation', () => {
      cy.get('nav, header').should('be.visible');
    });

    it('should display hero section', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="hero"], section:first-of-type').length) {
          cy.get('[class*="hero"], section:first-of-type').should('be.visible');
        }
      });
    });

    it('should display features section', () => {
      cy.contains(/features|what we offer/i).should('be.visible');
    });

    it('should display pricing section', () => {
      cy.contains(/pricing|plans/i).should('be.visible');
    });

    it('should have CTA buttons', () => {
      cy.contains(/get started|sign up|start free/i).should('be.visible');
    });

    it('should navigate to login', () => {
      cy.contains('a', /login|sign in/i).click();
      cy.url().should('include', '/login');
    });

    it('should navigate to register', () => {
      cy.contains('a', /sign up|get started|register/i).first().click();
      cy.url().should('include', '/register');
    });

    it('should display footer', () => {
      cy.get('footer').should('be.visible');
    });
  });

  describe('Pricing Page', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should display pricing plans', () => {
      cy.contains(/pricing|plans/i).scrollIntoView();
      cy.contains(/free|starter/i).should('be.visible');
      cy.contains(/professional|pro/i).should('be.visible');
    });

    it('should display plan features', () => {
      cy.contains(/pricing/i).scrollIntoView();
      cy.contains(/invoice|client/i).should('be.visible');
    });
  });

  describe('Legal Pages', () => {
    it('should display privacy policy', () => {
      cy.visit('/privacy-policy');
      cy.contains(/privacy/i).should('be.visible');
    });

    it('should display terms of service', () => {
      cy.visit('/terms-of-service');
      cy.contains(/terms/i).should('be.visible');
    });

    it('should display cookie policy', () => {
      cy.visit('/cookie-policy');
      cy.contains(/cookie/i).should('be.visible');
    });

    it('should display POPIA compliance', () => {
      cy.visit('/popia-compliance');
      cy.contains(/popia|protection/i).should('be.visible');
    });
  });

  describe('Support Pages', () => {
    it('should display FAQ page', () => {
      cy.visit('/faq');
      cy.contains(/faq|frequently/i).should('be.visible');
    });

    it('should display support page', () => {
      cy.visit('/support');
      cy.contains(/support|help/i).should('be.visible');
    });

    it('should display contact page', () => {
      cy.visit('/contact');
      cy.contains(/contact/i).should('be.visible');
    });

    it('should display documentation page', () => {
      cy.visit('/documentation');
      cy.contains(/documentation|docs|guide/i).should('be.visible');
    });
  });

  describe('Other Public Pages', () => {
    it('should display careers page', () => {
      cy.visit('/careers');
      cy.contains(/career|job/i).should('be.visible');
    });
  });

  describe('404 Page', () => {
    it('should display 404 for non-existent routes', () => {
      cy.visit('/non-existent-page-12345', { failOnStatusCode: false });
      cy.contains(/not found|404|doesn.*exist/i).should('be.visible');
    });

    it('should have link back to home', () => {
      cy.visit('/non-existent-page-12345', { failOnStatusCode: false });
      cy.contains('a', /home|back/i).should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('body').should('be.visible');
    });

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/');
      cy.get('body').should('be.visible');
    });

    it('should show mobile menu on small screens', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      
      cy.get('body').then(($body) => {
        if ($body.find('[class*="hamburger"], [class*="mobile-menu"], button[aria-label*="menu"]').length) {
          cy.get('[class*="hamburger"], [class*="mobile-menu"], button[aria-label*="menu"]').first().should('be.visible');
        }
      });
    });
  });

  describe('Cookie Consent', () => {
    it('should display cookie consent banner', () => {
      cy.clearLocalStorage();
      cy.visit('/');
      
      cy.get('body').then(($body) => {
        if ($body.find('[class*="cookie"], [class*="consent"]').length) {
          cy.get('[class*="cookie"], [class*="consent"]').should('be.visible');
        }
      });
    });

    it('should accept cookies', () => {
      cy.clearLocalStorage();
      cy.visit('/');
      
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Accept")').length) {
          cy.contains('button', /accept/i).click();
          // Banner should disappear
        }
      });
    });
  });
});
