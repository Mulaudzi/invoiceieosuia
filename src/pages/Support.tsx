import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { contactService } from "@/services/api";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { z } from "zod";
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  HelpCircle, 
  BookOpen,
  Send,
  Video,
  ArrowRight
} from "lucide-react";

// Validation schema for support form
const supportFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

type SupportFormData = z.infer<typeof supportFormSchema>;

const Support = () => {
  const { toast } = useToast();
  const { executeRecaptcha, isLoaded: recaptchaLoaded } = useRecaptcha();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SupportFormData, string>>>({});
  
  const [formData, setFormData] = useState<SupportFormData>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      value: "support@ieosuia.com",
      link: "/contact?purpose=support",
      isRoute: true
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
      icon: HelpCircle,
      title: "FAQ",
      description: "Browse frequently asked questions",
      link: "/faq",
      isRoute: true
    },
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
    }
  ];

  const validateForm = (): boolean => {
    try {
      supportFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof SupportFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof SupportFormData] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Execute reCAPTCHA
      let recaptchaToken = "";
      if (recaptchaLoaded) {
        recaptchaToken = await executeRecaptcha("contact_support");
      }

      // Call the contact API with "support" purpose
      await contactService.submit({
        name: formData.name,
        email: formData.email,
        message: `Subject: ${formData.subject}\n\nMessage: ${formData.message}`,
        purpose: "support",
        recaptcha_token: recaptchaToken,
      });

      toast({
        title: "Message Sent Successfully",
        description: "Thank you for reaching out. We'll get back to you within 24 hours.",
      });

      // Clear form
      setFormData({ name: "", email: "", subject: "", message: "" });
      setErrors({});
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast({
        title: "Failed to Send Message",
        description: error instanceof Error ? error.message : "An error occurred while sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHeader
          title="How Can We Help?"
          subtitle="Get the support you need. Browse our FAQ, read our documentation, or contact our team directly."
          icon={HelpCircle}
          badge="Support Center"
          showBackLink={false}
        />

        {/* Quick Links to FAQ */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Looking for Quick Answers?</h2>
              <p className="text-muted-foreground mb-6">
                Our comprehensive FAQ covers everything from getting started to advanced features.
              </p>
              <Link to="/faq">
                <Button variant="accent" size="lg" className="group">
                  Browse All FAQs
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Contact Us Directly</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {contactMethods.map((method) => (
                method.isRoute ? (
                  <Link key={method.title} to={method.link}>
                    <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer h-full hover:border-accent">
                      <CardHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                          <method.icon className="h-6 w-6 text-accent" />
                        </div>
                        <CardTitle className="text-lg">{method.title}</CardTitle>
                        <CardDescription>{method.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium text-accent">{method.value}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <a 
                    key={method.title} 
                    href={method.link}
                    target={method.title === "WhatsApp" ? "_blank" : undefined}
                    rel={method.title === "WhatsApp" ? "noopener noreferrer" : undefined}
                  >
                    <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer h-full hover:border-accent">
                      <CardHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                          <method.icon className="h-6 w-6 text-accent" />
                        </div>
                        <CardTitle className="text-lg">{method.title}</CardTitle>
                        <CardDescription>{method.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium text-accent">{method.value}</p>
                      </CardContent>
                    </Card>
                  </a>
                )
              ))}
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Resources</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {resources.map((resource) => (
                resource.isRoute ? (
                  <Link key={resource.title} to={resource.link}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full hover:border-accent">
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
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full hover:border-accent">
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
        <section className="py-16">
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
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your@email.com"
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <Input
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="How can we help?"
                        className={errors.subject ? "border-destructive" : ""}
                      />
                      {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <Textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Describe your issue or question..."
                        rows={5}
                        className={errors.message ? "border-destructive" : ""}
                      />
                      {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                    </div>
                    <Button 
                      type="submit" 
                      variant="accent" 
                      size="lg" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          Send Message
                          <Send className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      This message is from: IEOSUIA Invoices & Books Support Page
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
