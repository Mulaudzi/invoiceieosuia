import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                IEOSUIA Invoices & Books ("we", "our", or "us") is committed to protecting your privacy and complying with the Protection of Personal Information Act (POPIA) of South Africa. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our invoicing and bookkeeping platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-medium mb-3">2.1 Personal Information</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Name and email address</li>
                <li>Business information (company name, address, VAT number)</li>
                <li>Payment and billing information</li>
                <li>Phone number</li>
                <li>Banking details for invoice purposes</li>
              </ul>
              
              <h3 className="text-xl font-medium mb-3 mt-4">2.2 Usage Data</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>IP address and browser type</li>
                <li>Pages visited and features used</li>
                <li>Time and date of access</li>
                <li>Device information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>To provide and maintain our service</li>
                <li>To process invoices and payments</li>
                <li>To send transactional emails and notifications</li>
                <li>To improve our platform and user experience</li>
                <li>To comply with legal obligations including POPIA and tax regulations</li>
                <li>To prevent fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. POPIA Compliance</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In accordance with the Protection of Personal Information Act (POPIA), we:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Process personal information lawfully and in a reasonable manner</li>
                <li>Collect information only for a specific, explicitly defined purpose</li>
                <li>Do not retain personal information longer than necessary</li>
                <li>Take appropriate security measures to protect personal information</li>
                <li>Ensure information is accurate and up to date</li>
                <li>Process personal information openly and transparently</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share your data with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Service providers who assist in our operations (under strict data protection agreements)</li>
                <li>Payment processors for transaction handling</li>
                <li>Legal authorities when required by South African law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your data. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights Under POPIA</h2>
              <p className="text-muted-foreground leading-relaxed">As a data subject, you have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Access your personal information we hold</li>
                <li>Request correction of inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to the processing of your personal information</li>
                <li>Request a copy of your personal information in a portable format</li>
                <li>Withdraw consent for processing (where consent was the basis)</li>
                <li>Lodge a complaint with the Information Regulator</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies. See our Cookie Policy for more details on how we use cookies and how you can manage your preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your data for as long as your account is active or as needed to provide services. For tax and legal compliance in South Africa, certain financial records may be retained for up to 5 years. After this period, data will be securely deleted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Significant changes will be communicated via email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Information Regulator</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you are not satisfied with how we handle your personal information, you have the right to lodge a complaint with the Information Regulator of South Africa:
              </p>
              <ul className="list-none text-muted-foreground space-y-2 mt-2">
                <li>Website: www.justice.gov.za/inforeg/</li>
                <li>Email: inforeg@justice.gov.za</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us at:
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

export default PrivacyPolicy;
