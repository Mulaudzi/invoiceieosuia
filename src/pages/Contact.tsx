import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Mail, Phone, MapPin, MessageCircle, Clock, Send, ChevronDown } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import PageHeader from "@/components/landing/PageHeader";
import IEOSUIASocialLinks from "@/components/branding/IEOSUIASocialLinks";
import { contactService } from "@/services/api";
import { z } from "zod";

// Validation schema
const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
  purpose: z.enum(["general", "support", "sales"]),
});

type ContactFormData = z.infer<typeof contactSchema>;

// Purpose options with routing
const purposeOptions = [
  { 
    value: "general" as const, 
    label: "General / Friendly Inquiry", 
    email: "hello@ieosuia.com",
    description: "General questions, feedback, or just saying hello"
  },
  { 
    value: "support" as const, 
    label: "Support / Technical Help", 
    email: "support@ieosuia.com",
    description: "Technical issues, bug reports, or product assistance"
  },
  { 
    value: "sales" as const, 
    label: "Sales / Quotes / Partnerships", 
    email: "hello@ieosuia.com",
    description: "Business questions, custom workflows, or partnership opportunities"
  },
];

const Contact = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  
  // Get purpose from URL params or default to general
  const initialPurpose = searchParams.get("purpose") as "general" | "support" | "sales" || "general";
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    message: "",
    purpose: initialPurpose,
  });

  // Update purpose when URL changes
  useEffect(() => {
    const purposeParam = searchParams.get("purpose") as "general" | "support" | "sales";
    if (purposeParam && ["general", "support", "sales"].includes(purposeParam)) {
      setFormData(prev => ({ ...prev, purpose: purposeParam }));
    }
  }, [searchParams]);

  // Get origin URL for tracking
  const originUrl = typeof window !== "undefined" ? window.location.origin + location.pathname + location.search : "";

  const validateForm = (): boolean => {
    try {
      contactSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof ContactFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof ContactFormData] = err.message;
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
        description: "Please check the form for errors.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the API to send the email
      const response = await contactService.submit({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        purpose: formData.purpose,
        origin: originUrl,
      });

      toast({
        title: "Message sent!",
        description: response.message || `Your message has been sent. We'll get back to you soon.`,
      });

      setFormData({ name: "", email: "", message: "", purpose: initialPurpose });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactDetails = [
    {
      icon: Mail,
      label: "General Inquiries",
      value: "hello@ieosuia.com",
      description: "For general questions and information",
      purpose: "general" as const,
    },
    {
      icon: Mail,
      label: "Support",
      value: "support@ieosuia.com",
      description: "For technical support and assistance",
      purpose: "support" as const,
    },
    {
      icon: Mail,
      label: "Sales & Partnerships",
      value: "hello@ieosuia.com",
      description: "For quotes and partnership inquiries",
      purpose: "sales" as const,
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+27 63 808 2493",
      href: "tel:+27638082493",
      description: "Available for calls Monday-Friday",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "+27 63 808 2493",
      href: "https://wa.me/27638082493",
      description: "Quick responses via WhatsApp",
      isExternal: true,
    },
    {
      icon: MapPin,
      label: "Office Address",
      value: "26 Rock Alder, Extension 15, Naturena, Johannesburg, 2095",
      href: "https://maps.google.com/?q=26+Rock+Alder+Extension+15+Naturena+Johannesburg+2095",
      description: "Our physical location",
      isExternal: true,
    },
  ];

  const businessHours = [
    { day: "Monday - Friday", hours: "08:00 - 17:00" },
    { day: "Saturday", hours: "09:00 - 13:00" },
    { day: "Sunday & Public Holidays", hours: "Closed" },
  ];

  const handleContactClick = (contact: typeof contactDetails[0]) => {
    if (contact.purpose) {
      // For email contacts, update the form purpose instead of mailto
      setFormData(prev => ({ ...prev, purpose: contact.purpose! }));
      // Scroll to form
      document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <PageHeader
          title="Get in Touch"
          subtitle="Have a question or need assistance? We're here to help. Fill out the form below and we'll route your message to the right team."
          icon={Mail}
          badge="Contact Us"
        />

        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">Contact Information</h2>
              
              <div className="space-y-4">
                {contactDetails.map((contact, index) => (
                  contact.purpose ? (
                    // Email contacts - click to update form
                    <button
                      key={index}
                      onClick={() => handleContactClick(contact)}
                      className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors group w-full text-left"
                    >
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                        <contact.icon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{contact.label}</p>
                        <p className="font-medium text-foreground group-hover:text-accent transition-colors">
                          {contact.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{contact.description}</p>
                      </div>
                    </button>
                  ) : (
                    // Phone/Address contacts - regular links
                    <a
                      key={index}
                      href={contact.href}
                      target={contact.isExternal ? "_blank" : undefined}
                      rel={contact.isExternal ? "noopener noreferrer" : undefined}
                      className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                        <contact.icon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{contact.label}</p>
                        <p className="font-medium text-foreground group-hover:text-accent transition-colors">
                          {contact.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{contact.description}</p>
                      </div>
                    </a>
                  )
                ))}
              </div>

              {/* Business Hours */}
              <div className="mt-8 p-6 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-foreground">Business Hours</h3>
                </div>
                <div className="space-y-2">
                  {businessHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{schedule.day}</span>
                      <span className="text-foreground font-medium">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  * Response times may vary outside business hours. WhatsApp is monitored more frequently.
                </p>
              </div>

              {/* Social Links */}
              <div className="mt-8">
                <h3 className="font-semibold text-foreground mb-4">Follow Us</h3>
                <IEOSUIASocialLinks
                  className="flex items-center gap-4"
                  linkClassName="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>
            </div>

            {/* Contact Form */}
            <div id="contact-form">
              <div className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-foreground mb-2">Send us a Message</h2>
                <p className="text-muted-foreground mb-6">
                  Select the type of inquiry and we'll route your message to the right team.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Purpose Selection */}
                  <div>
                    <label htmlFor="purpose" className="block text-sm font-medium text-foreground mb-2">
                      Type of Inquiry
                    </label>
                    <div className="relative">
                      <select
                        id="purpose"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value as "general" | "support" | "sales" })}
                        className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        {purposeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {purposeOptions.find(p => p.value === formData.purpose)?.description}
                    </p>
                    <p className="text-xs text-accent mt-1">
                      → Will be sent to: {purposeOptions.find(p => p.value === formData.purpose)?.email}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Your Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={errors.name ? "border-destructive" : ""}
                      required
                    />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={errors.email ? "border-destructive" : ""}
                      required
                    />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className={errors.message ? "border-destructive" : ""}
                      rows={5}
                      required
                    />
                    {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                  </div>

                  {/* Hidden field for origin tracking */}
                  <input type="hidden" name="origin" value={originUrl} />

                  <Button type="submit" variant="accent" size="lg" className="w-full" disabled={isSubmitting}>
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
                    Your message will be sent to the appropriate team and CC'd to info@ieosuia.com for tracking.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
