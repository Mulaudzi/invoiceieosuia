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
                Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and provide a better user experience.
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
                <li>Authentication cookies to keep you logged in</li>
                <li>Security cookies to protect against fraud</li>
                <li>Session cookies to maintain your preferences</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.2 Analytics Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These cookies help us understand how visitors interact with our website:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Track page views and user journeys</li>
                <li>Identify popular features and content</li>
                <li>Measure website performance</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.3 Functional Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These cookies enable enhanced functionality:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Remember your language preferences</li>
                <li>Remember your display settings</li>
                <li>Store your consent preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may use third-party services that set their own cookies:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Google reCAPTCHA</strong> - For security and spam prevention</li>
                <li><strong>Google Analytics</strong> - For website analytics</li>
                <li><strong>Payment Processors</strong> - For secure payment processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Browser Settings:</strong> Most browsers allow you to view, manage, delete, and block cookies</li>
                <li><strong>Our Cookie Banner:</strong> Use our cookie consent banner to manage your preferences</li>
                <li><strong>Opt-Out Links:</strong> Third-party services often provide opt-out mechanisms</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Note: Disabling certain cookies may affect the functionality of our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cookie Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                Different cookies have different lifespans:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain until they expire or you delete them</li>
                <li><strong>Authentication Cookies:</strong> Typically last for 30 days or until logout</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time. We will notify you of any significant changes by posting a notice on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about our use of cookies, please contact us at:
              </p>
              <ul className="list-none text-muted-foreground space-y-2 mt-2">
                <li>Email: privacy@ieosuia.com</li>
                <li>Address: 123 Business Street, Suite 100, City, Country</li>
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
