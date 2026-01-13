import { Link } from "react-router-dom";
import { Shield, Lock, Eye, UserCheck, FileText, Server, Bell, Trash2, Download, MapPin, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import PageHeader from "@/components/landing/PageHeader";

const PopiaCompliance = () => {
  const sections = [
    {
      icon: Shield,
      title: "Our Commitment to POPIA",
      content: `IEOSUIA Invoices & Books is fully committed to complying with the Protection of Personal Information Act (POPIA) of South Africa. We take the privacy and security of your personal information seriously and have implemented comprehensive measures to ensure your data is protected.`
    },
    {
      icon: UserCheck,
      title: "Lawful Processing",
      content: `We process your personal information only when we have a lawful basis to do so, including:
• **Consent**: When you explicitly agree to provide your information
• **Contract**: When processing is necessary to fulfill our service agreement with you
• **Legal Obligation**: When required by law to process certain information
• **Legitimate Interest**: When processing is in our legitimate business interests and doesn't override your rights`
    },
    {
      icon: Eye,
      title: "Transparency & Notice",
      content: `We are transparent about how we collect, use, and process your personal information:
• We clearly explain what data we collect at the point of collection
• We inform you of the purpose for which your data will be used
• We provide details about who may access your data
• We notify you of your rights regarding your personal information`
    },
    {
      icon: Lock,
      title: "Security Safeguards",
      content: `We implement robust security measures to protect your personal information:
• **Encryption**: All data is encrypted in transit (TLS/SSL) and at rest
• **Access Control**: Strict role-based access controls limit who can view your data
• **Secure Infrastructure**: Our systems are hosted on secure, compliant infrastructure
• **Regular Audits**: We conduct regular security assessments and vulnerability testing
• **Password Protection**: All passwords are hashed using industry-standard algorithms
• **Session Management**: Automatic session timeouts and secure cookie handling`
    },
    {
      icon: FileText,
      title: "Data Collection & Purpose",
      content: `We collect only the information necessary to provide our services:

**Account Information**
• Name, email address, and contact details for account creation and communication
• Business information for invoice generation

**Transaction Data**
• Invoice details, payment records, and client information you enter
• This data is essential for providing our invoicing and bookkeeping services

**Usage Data**
• How you interact with our platform to improve our services
• Technical data like IP address and browser type for security purposes

**Communication Data**
• Records of support requests and correspondence for quality service delivery`
    },
    {
      icon: Server,
      title: "Data Storage & Retention",
      content: `Your data is stored securely and retained only as long as necessary:
• **Location**: Data is stored on secure servers with appropriate safeguards
• **Retention Period**: We retain your data for as long as your account is active, plus any period required by law (typically 5 years for financial records)
• **Backup**: Regular backups ensure your data is not lost
• **Deletion**: Upon account deletion or request, your data is permanently removed within 30 days`
    },
    {
      icon: Bell,
      title: "Third-Party Sharing",
      content: `We limit third-party access to your data:
• We do **not** sell your personal information to any third party
• We share data only with service providers necessary to operate our platform (e.g., payment processors, email services)
• All third parties are bound by confidentiality agreements and POPIA compliance requirements
• We share information when legally required to do so by court order or regulatory request`
    },
    {
      icon: Download,
      title: "Your Rights Under POPIA",
      content: `As a data subject, you have the following rights:

**Right to Access**
Request a copy of all personal information we hold about you

**Right to Correction**
Request correction of any inaccurate or incomplete personal information

**Right to Deletion**
Request deletion of your personal information (right to be forgotten)

**Right to Object**
Object to the processing of your personal information for specific purposes

**Right to Data Portability**
Request your data in a structured, commonly used format

**Right to Withdraw Consent**
Withdraw consent for processing at any time

**Right to Lodge a Complaint**
File a complaint with the Information Regulator if you believe your rights have been violated`
    },
    {
      icon: UserCheck,
      title: "Exercising Your Rights",
      content: `To exercise any of your POPIA rights:

1. **Log into your account** and navigate to Settings > Privacy & Data
2. **Use our Data Export feature** to download all your personal information
3. **Use our Account Deletion feature** to permanently delete your account and data
4. **Contact our Information Officer** directly for any other requests

Requests will be processed within 30 days as required by POPIA.`
    },
    {
      icon: Trash2,
      title: "Data Breach Notification",
      content: `In the event of a data breach that may compromise your personal information:
• We will notify affected users within 72 hours of discovering the breach
• We will inform the Information Regulator as required by law
• We will provide clear information about the nature of the breach and steps to protect yourself
• We will take immediate action to contain the breach and prevent further unauthorized access`
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <PageHeader
          title="POPIA Compliance"
          subtitle="Protection of Personal Information Act - Your Privacy Matters"
          icon={Shield}
          badge="Data Protection"
        />

        <div className="container mx-auto px-4 max-w-4xl py-16">
          {/* Introduction */}
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 mb-12">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Your Privacy Matters
            </h2>
            <p className="text-muted-foreground">
              At IEOSUIA Invoices & Books, protecting your personal information is a top priority. This document outlines how we comply with the Protection of Personal Information Act (POPIA) of South Africa and the measures we take to safeguard your data.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section, index) => (
              <section key={index} className="border-b border-border pb-8 last:border-0">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                </div>
                <div className="prose prose-sm max-w-none text-muted-foreground ml-14">
                  {section.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 whitespace-pre-wrap">
                      {line.split('**').map((part, j) => 
                        j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Information Officer */}
          <div className="mt-12 bg-muted/30 rounded-xl p-8 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Information Officer Contact
            </h2>
            <p className="text-muted-foreground mb-6">
              For any POPIA-related inquiries, requests, or complaints, please contact our designated Information Officer:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent" />
                <Link to="/contact?purpose=general" className="text-accent hover:underline">
                  Contact us for privacy inquiries
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent" />
                <a href="tel:+27799282775" className="text-foreground hover:text-accent">
                  +27 79 928 2775
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent mt-0.5" />
                <span className="text-foreground">
                  26 Rock Alder, Extension 15, Naturena, Johannesburg, 2095
                </span>
              </div>
            </div>
          </div>

          {/* Information Regulator */}
          <div className="mt-8 bg-primary/5 rounded-xl p-8 border border-primary/10">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Information Regulator
            </h2>
            <p className="text-muted-foreground mb-4">
              If you believe your rights under POPIA have been violated and we have not adequately addressed your concerns, you may lodge a complaint with the Information Regulator:
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Website:</strong> <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.justice.gov.za/inforeg</a></p>
              <p><strong className="text-foreground">Email:</strong> <a href="mailto:inforeg@justice.gov.za" className="text-accent hover:underline">inforeg@justice.gov.za</a></p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/privacy-policy">
              <Button variant="outline">View Privacy Policy</Button>
            </Link>
            <Link to="/terms-of-service">
              <Button variant="outline">View Terms of Service</Button>
            </Link>
            <Link to="/contact">
              <Button variant="accent">Contact Us</Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PopiaCompliance;
