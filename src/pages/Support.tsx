import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  FileText, 
  HelpCircle, 
  BookOpen,
  Clock,
  Search,
  Send,
  Video
} from "lucide-react";

const Support = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs = [
    // Getting Started
    {
      category: "Getting Started",
      question: "How do I create my first invoice?",
      answer: "After logging in, navigate to the Dashboard and click 'Create Invoice'. Fill in your client details, add line items, and click 'Save' or 'Send' to deliver it directly to your client via email or SMS."
    },
    {
      category: "Getting Started",
      question: "How do I set up my business profile?",
      answer: "Go to Dashboard > Profile to add your business name, logo, address, and banking details. This information will appear on all your invoices automatically."
    },
    {
      category: "Getting Started",
      question: "Can I import my existing clients?",
      answer: "Yes! Navigate to Dashboard > Clients and use the import feature to upload your client list from a CSV file. We provide a template to help you format your data correctly."
    },
    // Invoicing
    {
      category: "Invoicing",
      question: "Can I customize my invoice templates?",
      answer: "Yes! Go to Dashboard > Templates to access our template editor. You can customize colors, add your logo, modify layouts, and save multiple templates for different purposes."
    },
    {
      category: "Invoicing",
      question: "How do I add a new client?",
      answer: "Navigate to Dashboard > Clients and click 'Add Client'. Enter their details including name, email, phone number, and address. Clients are automatically saved for future invoices."
    },
    {
      category: "Invoicing",
      question: "Can I create recurring invoices?",
      answer: "Yes, with Pro and Business plans. Go to Dashboard > Recurring and set up invoices that automatically generate and send on a schedule (weekly, monthly, quarterly, or annually)."
    },
    {
      category: "Invoicing",
      question: "How do I add VAT to my invoices?",
      answer: "When creating an invoice, you can add VAT as a line item or configure your default VAT rate in Dashboard > Settings. The system will automatically calculate VAT on your invoices."
    },
    {
      category: "Invoicing",
      question: "Can I send invoices in different currencies?",
      answer: "Yes! IEOSUIA supports multiple currencies. When creating an invoice, simply select the currency from the dropdown menu. The default is ZAR (South African Rand)."
    },
    // Payments
    {
      category: "Payments",
      question: "What payment methods do you support?",
      answer: "We support various payment methods including bank transfers (EFT), credit cards, and integration with popular payment gateways. You can configure your preferred methods in Dashboard > Settings."
    },
    {
      category: "Payments",
      question: "How do I record a payment received?",
      answer: "Navigate to the invoice and click 'Record Payment'. Enter the amount, date, and payment method. The invoice status will automatically update to reflect partial or full payment."
    },
    {
      category: "Payments",
      question: "Can clients pay online through the invoice?",
      answer: "Yes, when you enable online payments, clients receive a link to pay directly. The payment is automatically recorded and you're notified immediately."
    },
    // Communications
    {
      category: "Communications",
      question: "Can I send invoices via SMS?",
      answer: "Yes! When viewing an invoice, click the 'Send' button and select 'Send via SMS'. Make sure your client has a valid phone number on file. SMS messages use your SMS credits."
    },
    {
      category: "Communications",
      question: "How do payment reminders work?",
      answer: "You can send manual reminders on any plan, or set up automated reminders with Pro and Business plans. Reminders can be sent via email or SMS before, on, or after the due date."
    },
    {
      category: "Communications",
      question: "How many emails and SMS can I send?",
      answer: "Each plan includes a monthly allocation. Free: 20 emails, 0 SMS. Solo: 50 emails, 10 SMS. Pro: 100 emails, 25 SMS. Business: 200 emails, 50 SMS. Additional credits can be purchased anytime."
    },
    {
      category: "Communications",
      question: "Can I customize email templates?",
      answer: "Yes! Go to Dashboard > Email Templates to customize the emails that are sent with your invoices and reminders. You can add your branding and personalized messages."
    },
    // Reports
    {
      category: "Reports",
      question: "How do I export my reports?",
      answer: "Go to Dashboard > Reports, select your desired report type and date range, then click the 'Export' button. Reports are available in PDF and CSV formats."
    },
    {
      category: "Reports",
      question: "What reports are available?",
      answer: "We offer various reports including: Income Summary, Outstanding Invoices, Client Statements, Payment History, and Tax Reports. Advanced analytics are available on Pro and Business plans."
    },
    // Account & Billing
    {
      category: "Account & Billing",
      question: "How do I upgrade my plan?",
      answer: "Go to Dashboard > Settings > Subscription to view available plans and upgrade options. All plan changes take effect immediately with prorated billing."
    },
    {
      category: "Account & Billing",
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel anytime from Dashboard > Settings > Subscription. Your data remains accessible until the end of your billing period, and you can export it at any time."
    },
    {
      category: "Account & Billing",
      question: "How do I purchase more SMS or email credits?",
      answer: "Go to Dashboard > Settings > Credits to top up your email or SMS balance. Credits never expire and can be used across all your invoicing activities."
    },
    // Security
    {
      category: "Security",
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption, secure servers, and regular security audits. Your data is backed up daily and never shared with third parties. We're fully POPIA compliant."
    },
    {
      category: "Security",
      question: "How do I reset my password?",
      answer: "Click 'Forgot Password' on the login page and enter your email. You'll receive a link to reset your password. For security, the link expires after 1 hour."
    },
    {
      category: "Security",
      question: "Can multiple team members access my account?",
      answer: "Yes, with Pro (3 users) and Business (10 users) plans. Go to Dashboard > Settings > Team to invite team members with specific roles and permissions."
    },
    // Technical
    {
      category: "Technical",
      question: "What browsers are supported?",
      answer: "IEOSUIA works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience."
    },
    {
      category: "Technical",
      question: "Can I use IEOSUIA on my phone?",
      answer: "Yes! Our platform is fully responsive and works great on mobile devices. You can create, send, and manage invoices from your smartphone or tablet."
    },
    {
      category: "Technical",
      question: "How do I add my business logo?",
      answer: "Go to Dashboard > Profile and click on the logo placeholder to upload your logo. Supported formats include PNG, JPG, and SVG. We recommend a square logo for best results."
    }
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      value: "support@ieosuia.com",
      link: "mailto:support@ieosuia.com"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call us (calls only)",
      value: "+27 79 928 2775",
      link: "tel:+27799282775"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Chat with us",
      value: "+27 63 808 2493",
      link: "https://wa.me/27638082493?text=Hi!%20I%20need%20help%20with%20IEOSUIA%20Invoices."
    }
  ];

  const resources = [
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Detailed guides and tutorials",
      link: "/documentation",
      isRoute: true
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      link: "https://www.youtube.com/@ieosuia",
      isRoute: false
    },
    {
      icon: HelpCircle,
      title: "FAQ",
      description: "Quick answers below",
      link: "#faq",
      isRoute: false
    }
  ];

  const filteredFaqs = faqs.filter(
    faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group FAQs by category
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Message Sent",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">How Can We Help?</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get the support you need. Browse our FAQ, read our documentation, or contact our team directly.
            </p>
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Contact Us</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {contactMethods.map((method) => (
                <a 
                  key={method.title} 
                  href={method.link}
                  target={method.title === "WhatsApp" ? "_blank" : undefined}
                  rel={method.title === "WhatsApp" ? "noopener noreferrer" : undefined}
                >
                  <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <method.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{method.title}</CardTitle>
                      <CardDescription>{method.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium text-primary">{method.value}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-2">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-center mb-8">
              Find quick answers to common questions
            </p>
            <div className="max-w-3xl mx-auto">
              {Object.entries(groupedFaqs).length > 0 ? (
                Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
                  <div key={category} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-accent">{category}</h3>
                    <Accordion type="single" collapsible className="space-y-3">
                      {categoryFaqs.map((faq, index) => (
                        <AccordionItem 
                          key={index} 
                          value={`${category}-${index}`}
                          className="bg-background rounded-lg border px-4"
                        >
                          <AccordionTrigger className="text-left hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No results found. Try a different search term or contact us directly.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Resources</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {resources.map((resource) => (
                resource.isRoute ? (
                  <Link key={resource.title} to={resource.link}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                          <resource.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ) : (
                  <a 
                    key={resource.title} 
                    href={resource.link}
                    target={resource.link.startsWith('http') ? "_blank" : undefined}
                    rel={resource.link.startsWith('http') ? "noopener noreferrer" : undefined}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                          <resource.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </a>
                )
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-2">Send Us a Message</h2>
              <p className="text-muted-foreground text-center mb-8">
                Can't find what you're looking for? Send us a message and we'll get back to you.
              </p>
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <Input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <Input
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="How can we help?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <Textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Describe your issue or question..."
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This message will be sent from IEOSUIA Invoices & Books support form.
                    </p>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Typical response time: Within 24 hours</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
