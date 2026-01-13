import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Mail, Phone, MapPin, MessageCircle, Clock, Send, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import PageHeader from "@/components/landing/PageHeader";
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
    email: "sales@ieosuia.com",
    description: "Pricing inquiries, custom quotes, or partnership opportunities"
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
      value: "sales@ieosuia.com",
      description: "For quotes and partnership inquiries",
      purpose: "sales" as const,
    },
    {
      icon: Phone,
      label: "Phone (Primary)",
      value: "+27 79 928 2775",
      href: "tel:+27799282775",
      description: "Available for calls Monday-Friday",
    },
    {
      icon: Phone,
      label: "Phone (Alternate)",
      value: "+27 63 154 0696",
      href: "tel:+27631540696",
      description: "Alternate contact number",
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
                <div className="flex items-center gap-4">
                  <a
                    href="https://www.instagram.com/ieosuia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center hover:border-accent hover:bg-accent/10 transition-colors"
                    aria-label="Instagram"
                  >
                    <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.facebook.com/ieosuia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center hover:border-accent hover:bg-accent/10 transition-colors"
                    aria-label="Facebook"
                  >
                    <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.youtube.com/@ieosuia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center hover:border-accent hover:bg-accent/10 transition-colors"
                    aria-label="YouTube"
                  >
                    <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  <a
                    href="https://wa.me/27638082493"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center hover:border-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                </div>
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