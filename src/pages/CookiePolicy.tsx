import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and provide a better user experience. This policy explains how IEOSUIA Invoices & Books uses cookies in compliance with South African law and the Protection of Personal Information Act (POPIA).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                IEOSUIA Invoices & Books uses cookies for the following purposes:
              </p>
              
              <h3 className="text-xl font-medium mb-3">2.1 Essential Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These cookies are necessary for the website to function and cannot be switched off. They include:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Authentication cookies to keep you logged in securely</li>
                <li>Security cookies to protect against fraud and unauthorized access</li>
                <li>Session cookies to maintain your preferences and settings</li>
                <li>Cookie consent cookies to remember your cookie preferences</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.2 Analytics Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These cookies help us understand how visitors interact with our website:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Track page views and user journeys</li>
                <li>Identify popular features and content</li>
                <li>Measure website performance and load times</li>
                <li>Understand which features are most useful</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.3 Functional Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These cookies enable enhanced functionality:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Remember your language and currency preferences</li>
                <li>Remember your display and theme settings</li>
                <li>Store your consent preferences</li>
                <li>Remember recently viewed pages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may use third-party services that set their own cookies:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Google reCAPTCHA</strong> - For security and spam prevention</li>
                <li><strong>Google Analytics</strong> - For website analytics (anonymized)</li>
                <li><strong>Payment Processors</strong> - For secure payment processing</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                These third parties have their own privacy policies regarding how they use such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Browser Settings:</strong> Most browsers allow you to view, manage, delete, and block cookies through their settings</li>
                <li><strong>Our Cookie Banner:</strong> Use our cookie consent banner when you first visit to manage your preferences</li>
                <li><strong>Opt-Out Links:</strong> Third-party services often provide opt-out mechanisms on their websites</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Note:</strong> Disabling essential cookies may affect the functionality of our website. You may not be able to log in or use certain features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cookie Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                Different cookies have different lifespans:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain until they expire (typically 30 days to 1 year) or you delete them</li>
                <li><strong>Authentication Cookies:</strong> Typically last for 30 days or until you log out</li>
                <li><strong>Consent Cookies:</strong> Last for 12 months</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                Under POPIA and applicable data protection laws, you have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Know what cookies we use and why</li>
                <li>Opt out of non-essential cookies</li>
                <li>Delete cookies that have been set</li>
                <li>Change your consent preferences at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any significant changes by posting a notice on our website and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about our use of cookies, please contact us at:
              </p>
              <ul className="list-none text-muted-foreground space-y-2 mt-2">
                <li>Email: hello@ieosuia.com</li>
                <li>Support: support@ieosuia.com</li>
                <li>Address: 26 Rock Alder, Extension 15, Naturena, Johannesburg, 2095</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
