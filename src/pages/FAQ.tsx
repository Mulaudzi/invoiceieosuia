import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  HelpCircle, 
  Zap, 
  FileText, 
  CreditCard, 
  MessageSquare, 
  BarChart3, 
  UserCog, 
  Shield, 
  Settings,
  DollarSign
} from "lucide-react";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = [
    {
      name: "Getting Started",
      icon: Zap,
      faqs: [
        {
          question: "How do I create my first invoice?",
          answer: "After logging in, navigate to the Dashboard and click 'Create Invoice'. Fill in your client details, add line items, and click 'Save' or 'Send' to deliver it directly to your client via email or SMS."
        },
        {
          question: "How do I set up my business profile?",
          answer: "Go to Dashboard > Profile to add your business name, logo, address, and banking details. This information will appear on all your invoices automatically."
        },
        {
          question: "Can I import my existing clients?",
          answer: "Yes! Navigate to Dashboard > Clients and use the import feature to upload your client list from a CSV file. We provide a template to help you format your data correctly."
        },
        {
          question: "Can I try IEOSUIA before paying?",
          answer: "Absolutely! Our Free plan gives you access to core features forever - no credit card required. You can also start a 14-day free trial of any paid plan to experience all premium features."
        }
      ]
    },
    {
      name: "Invoicing",
      icon: FileText,
      faqs: [
        {
          question: "Can I customize my invoice templates?",
          answer: "Yes! Go to Dashboard > Templates to access our template editor. You can customize colors, add your logo, modify layouts, and save multiple templates for different purposes."
        },
        {
          question: "How do I add a new client?",
          answer: "Navigate to Dashboard > Clients and click 'Add Client'. Enter their details including name, email, phone number, and address. Clients are automatically saved for future invoices."
        },
        {
          question: "Can I create recurring invoices?",
          answer: "Yes, with Pro and Business plans. Go to Dashboard > Recurring and set up invoices that automatically generate and send on a schedule (weekly, monthly, quarterly, or annually)."
        },
        {
          question: "How do I add VAT to my invoices?",
          answer: "When creating an invoice, you can add VAT as a line item or configure your default VAT rate in Dashboard > Settings. The system will automatically calculate VAT on your invoices."
        },
        {
          question: "Can I send invoices in different currencies?",
          answer: "Yes! IEOSUIA supports multiple currencies. When creating an invoice, simply select the currency from the dropdown menu. The default is ZAR (South African Rand)."
        },
        {
          question: "What's the difference between monthly invoices limits?",
          answer: "Free plan allows up to 30 invoices per month. All paid plans (Solo, Pro, Business) offer unlimited invoices - create as many as your business needs."
        }
      ]
    },
    {
      name: "Payments",
      icon: CreditCard,
      faqs: [
        {
          question: "What payment methods do you support?",
          answer: "We support various payment methods including bank transfers (EFT), credit cards, and integration with popular payment gateways. You can configure your preferred methods in Dashboard > Settings."
        },
        {
          question: "How do I record a payment received?",
          answer: "Navigate to the invoice and click 'Record Payment'. Enter the amount, date, and payment method. The invoice status will automatically update to reflect partial or full payment."
        },
        {
          question: "Can clients pay online through the invoice?",
          answer: "Yes, when you enable online payments, clients receive a link to pay directly. The payment is automatically recorded and you're notified immediately."
        }
      ]
    },
    {
      name: "Communications",
      icon: MessageSquare,
      faqs: [
        {
          question: "Can I send invoices via SMS?",
          answer: "Yes! When viewing an invoice, click the 'Send' button and select 'Send via SMS'. Make sure your client has a valid phone number on file. SMS messages use your SMS credits."
        },
        {
          question: "How do payment reminders work?",
          answer: "You can send manual reminders on any plan, or set up automated reminders with Pro and Business plans. Reminders can be sent via email or SMS before, on, or after the due date."
        },
        {
          question: "How many emails and SMS can I send?",
          answer: "Each plan includes a monthly allocation. Free: 20 emails, 0 SMS. Solo: 50 emails, 10 SMS. Pro: 100 emails, 25 SMS. Business: 200 emails, 50 SMS. Additional credits can be purchased anytime."
        },
        {
          question: "Can I customize email templates?",
          answer: "Yes! Go to Dashboard > Email Templates to customize the emails that are sent with your invoices and reminders. You can add your branding and personalized messages."
        },
        {
          question: "What happens when I exceed my monthly email or SMS limit?",
          answer: "You can continue sending by purchasing additional credits from your dashboard. Additional emails cost R0.10 each, and SMS costs vary by plan (R0.23-R0.25 each). Credits never expire."
        }
      ]
    },
    {
      name: "Reports & Analytics",
      icon: BarChart3,
      faqs: [
        {
          question: "How do I export my reports?",
          answer: "Go to Dashboard > Reports, select your desired report type and date range, then click the 'Export' button. Reports are available in PDF and CSV formats."
        },
        {
          question: "What reports are available?",
          answer: "We offer various reports including: Income Summary, Outstanding Invoices, Client Statements, Payment History, and Tax Reports. Advanced analytics are available on Pro and Business plans."
        }
      ]
    },
    {
      name: "Account & Billing",
      icon: UserCog,
      faqs: [
        {
          question: "How do I upgrade my plan?",
          answer: "Go to Dashboard > Settings > Subscription to view available plans and upgrade options. All plan changes take effect immediately with prorated billing."
        },
        {
          question: "Can I cancel my subscription?",
          answer: "Yes, you can cancel anytime from Dashboard > Settings > Subscription. Your data remains accessible until the end of your billing period, and you can export it at any time."
        },
        {
          question: "How do I purchase more SMS or email credits?",
          answer: "Go to Dashboard > Settings > Credits to top up your email or SMS balance. Credits never expire and can be used across all your invoicing activities."
        },
        {
          question: "Can I change or cancel my plan anytime?",
          answer: "Yes! You can upgrade, downgrade, or cancel your plan at any time from your dashboard. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing cycle."
        },
        {
          question: "Can I add team members to my account?",
          answer: "Team access depends on your plan: Free and Solo plans are single-user. Pro plan includes 3 team members. Business plan includes up to 10 team members with role-based permissions."
        }
      ]
    },
    {
      name: "Pricing & Payments",
      icon: DollarSign,
      faqs: [
        {
          question: "Is there a discount for annual billing?",
          answer: "Yes! When you choose annual billing, you save 20% compared to monthly billing. Toggle the billing switch on our pricing page to see annual prices."
        },
        {
          question: "What payment methods do you accept for subscriptions?",
          answer: "We accept all major credit and debit cards, as well as EFT/bank transfers for annual plans. All payments are processed securely in South African Rand (ZAR)."
        },
        {
          question: "Do you offer refunds?",
          answer: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied within the first 14 days, contact us for a full refund. After 14 days, unused time is not refundable."
        },
        {
          question: "Do you offer custom enterprise pricing?",
          answer: "Yes! For larger organizations needing custom limits, dedicated infrastructure, or special requirements, contact us at hello@ieosuia.com for a tailored enterprise solution."
        },
        {
          question: "Are there any hidden fees?",
          answer: "No hidden fees. The price you see is what you pay. The only additional costs are if you purchase extra email or SMS credits beyond your plan's monthly allocation."
        }
      ]
    },
    {
      name: "Security & Privacy",
      icon: Shield,
      faqs: [
        {
          question: "Is my data secure?",
          answer: "Absolutely. We use industry-standard encryption, secure servers, and regular security audits. Your data is backed up daily and never shared with third parties. We're fully POPIA compliant."
        },
        {
          question: "How do I reset my password?",
          answer: "Click 'Forgot Password' on the login page and enter your email. You'll receive a link to reset your password. For security, the link expires after 1 hour."
        },
        {
          question: "Can multiple team members access my account?",
          answer: "Yes, with Pro (3 users) and Business (10 users) plans. Go to Dashboard > Settings > Team to invite team members with specific roles and permissions."
        }
      ]
    },
    {
      name: "Technical",
      icon: Settings,
      faqs: [
        {
          question: "What browsers are supported?",
          answer: "IEOSUIA works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience."
        },
        {
          question: "Can I use IEOSUIA on my phone?",
          answer: "Yes! Our platform is fully responsive and works great on mobile devices. You can create, send, and manage invoices from your smartphone or tablet."
        },
        {
          question: "How do I add my business logo?",
          answer: "Go to Dashboard > Profile and click on the logo placeholder to upload your logo. Supported formats include PNG, JPG, and SVG. We recommend a square logo for best results."
        }
      ]
    }
  ];

  // Flatten all FAQs for search
  const allFaqs = faqCategories.flatMap(category => 
    category.faqs.map(faq => ({ ...faq, category: category.name, icon: category.icon }))
  );

  // Filter FAQs based on search query
  const filteredCategories = searchQuery
    ? faqCategories.map(category => ({
        ...category,
        faqs: category.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.faqs.length > 0)
    : faqCategories;

  const totalFaqs = allFaqs.length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-20 pt-32">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              Frequently Asked Questions
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How Can We Help You?
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Find answers to common questions about IEOSUIA Invoices & Books. 
              Browse by category or search for specific topics.
            </p>
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder={`Search ${totalFaqs} FAQs...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg bg-white text-foreground"
              />
            </div>
          </div>
        </section>

        {/* Quick Category Nav */}
        <section className="py-8 border-b bg-background sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2">
              {faqCategories.map((category) => (
                <a
                  key={category.name}
                  href={`#${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
                >
                  <category.icon className="w-4 h-4" />
                  {category.name}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div 
                  key={category.name} 
                  id={category.name.toLowerCase().replace(/\s+/g, '-')}
                  className="mb-12 scroll-mt-32"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-accent" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {category.faqs.length} question{category.faqs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Accordion type="single" collapsible className="space-y-3">
                    {category.faqs.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`${category.name}-${index}`}
                        className="bg-card rounded-lg border px-4 data-[state=open]:border-accent"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <span className="font-medium">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any FAQs matching "{searchQuery}". Try a different search term.
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Still Need Help */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-accent" />
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/support">
                <Button variant="accent" size="lg">
                  Contact Support
                </Button>
              </Link>
              <Link to="/documentation">
                <Button variant="outline" size="lg">
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
