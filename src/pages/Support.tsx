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
  Send
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
    {
      question: "How do I create my first invoice?",
      answer: "After logging in, navigate to the Dashboard and click 'Create Invoice'. Fill in your client details, add line items, and click 'Save' or 'Send' to deliver it directly to your client."
    },
    {
      question: "Can I customize my invoice templates?",
      answer: "Yes! Go to Dashboard > Templates to access our template editor. You can customize colors, add your logo, modify layouts, and save multiple templates for different purposes."
    },
    {
      question: "How do I add a new client?",
      answer: "Navigate to Dashboard > Clients and click 'Add Client'. Enter their details including name, email, address, and any custom fields. Clients are automatically saved for future invoices."
    },
    {
      question: "What payment methods do you support?",
      answer: "We support various payment methods including credit cards, bank transfers, and popular payment gateways. You can configure your preferred methods in Dashboard > Settings."
    },
    {
      question: "How do I export my reports?",
      answer: "Go to Dashboard > Reports, select your desired report type and date range, then click the 'Export' button. Reports are available in PDF and CSV formats."
    },
    {
      question: "Can I send invoices via SMS?",
      answer: "Yes! When viewing an invoice, click the 'Send' button and select 'Send via SMS'. Make sure your client has a valid phone number on file."
    },
    {
      question: "How do I upgrade my plan?",
      answer: "Go to Dashboard > Settings > Billing to view available plans and upgrade options. All plan changes take effect immediately with prorated billing."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption, secure servers, and regular security audits. Your data is backed up daily and never shared with third parties."
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
      description: "Talk to our team",
      value: "+1 (555) 123-4567",
      link: "tel:+15551234567"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with us now",
      value: "Available 24/7",
      link: "#"
    }
  ];

  const resources = [
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Detailed guides and tutorials",
      link: "#"
    },
    {
      icon: FileText,
      title: "API Reference",
      description: "For developers and integrations",
      link: "#"
    },
    {
      icon: HelpCircle,
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      link: "#"
    }
  ];

  const filteredFaqs = faqs.filter(
    faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <a key={method.title} href={method.link}>
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
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-2">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-center mb-8">
              Find quick answers to common questions
            </p>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
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
              {filteredFaqs.length === 0 && (
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
                <a key={resource.title} href={resource.link}>
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
