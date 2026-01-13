import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using IEOSUIA Invoices & Books ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service. These Terms are governed by the laws of the Republic of South Africa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                IEOSUIA provides an online invoicing and bookkeeping platform that allows users to create, send, and manage invoices, track payments, manage clients, send reminders via email and SMS, and generate financial reports. The platform is designed primarily for South African businesses and supports ZAR and other currencies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must be at least 18 years old to use this Service</li>
                <li>One person or legal entity may not maintain more than one account without prior approval</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in South Africa or your jurisdiction</li>
                <li>Upload viruses or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Create fake invoices or engage in fraudulent activities</li>
                <li>Resell or redistribute the Service without authorization</li>
                <li>Use the Service to send spam or unsolicited communications</li>
                <li>Impersonate others or misrepresent your affiliation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Paid plans are billed in South African Rand (ZAR) in advance on a monthly or annual basis</li>
                <li>All prices are inclusive of VAT where applicable</li>
                <li>All fees are non-refundable unless otherwise stated</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
                <li>Failure to pay may result in account suspension or termination</li>
                <li>Additional SMS and email credits are charged at the rates specified in your plan</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by IEOSUIA and are protected by South African and international copyright, trademark, and other intellectual property laws. You retain ownership of your data and content uploaded to the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. User Content</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>You retain all rights to your invoices, client data, and other content</li>
                <li>You grant us a license to store and process your content to provide the Service</li>
                <li>You are solely responsible for the accuracy of your content</li>
                <li>We may remove content that violates these Terms</li>
                <li>You are responsible for ensuring your invoices comply with SARS requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                We process your data in accordance with our Privacy Policy and the Protection of Personal Information Act (POPIA). By using the Service, you consent to such processing and warrant that all data provided is accurate.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Service Availability</h2>
              <p className="text-muted-foreground leading-relaxed">
                We strive for 99.9% uptime but do not guarantee uninterrupted access. We may suspend the Service for maintenance, updates, or circumstances beyond our control. We will endeavor to provide advance notice of planned maintenance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by South African law, IEOSUIA shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless IEOSUIA, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>You may terminate your account at any time from your dashboard</li>
                <li>We may terminate or suspend your account for violations of these Terms</li>
                <li>Upon termination, you may export your data within 30 days</li>
                <li>Provisions that should survive termination will remain in effect</li>
                <li>We reserve the right to delete data 30 days after account termination</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Modifications to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will provide notice of significant changes via email and on our website. Continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of South Africa, sitting in Johannesburg.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms, please contact us at:
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

export default TermsOfService;
