import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, MessageCircle, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Validation schema
const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
  purpose: z.enum(["general", "support", "sales"]),
});

type ContactFormData = z.infer<typeof contactSchema>;

const purposeOptions = [
  { value: "general" as const, label: "General Inquiry", email: "hello@ieosuia.com" },
  { value: "support" as const, label: "Support / Technical Help", email: "support@ieosuia.com" },
  { value: "sales" as const, label: "Sales / Partnerships", email: "sales@ieosuia.com" },
];

const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    message: "",
    purpose: "general",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

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

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const purposeOption = purposeOptions.find(p => p.value === formData.purpose);

    toast({
      title: "Message sent!",
      description: `Your message has been sent to ${purposeOption?.email}. We'll respond within 24 hours.`,
    });

    setFormData({ name: "", email: "", message: "", purpose: "general" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "hello@ieosuia.com",
      purpose: "general" as const,
    },
    {
      icon: Phone,
      label: "Phone (Calls)",
      value: "+27 79 928 2775",
      href: "tel:+27799282775",
    },
    {
      icon: MapPin,
      label: "Address",
      value: "26 Rock Alder, Extension 15, Naturena, Johannesburg, 2095",
      href: "https://maps.google.com/?q=26+Rock+Alder+Extension+15+Naturena+Johannesburg+2095",
      isExternal: true,
    },
  ];

  const whatsappNumber = "27638082493";

  const handleContactClick = (item: typeof contactInfo[0]) => {
    if (item.purpose) {
      setFormData(prev => ({ ...prev, purpose: item.purpose! }));
      document.getElementById("contact-form-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="contact" className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Contact Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get in <span className="text-accent">Touch</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Have questions? We're here to help. Reach out and we'll respond within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Form */}
          <div id="contact-form-section" className="bg-card rounded-2xl p-8 border border-border shadow-soft">
            <h3 className="text-xl font-semibold text-foreground mb-6">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Purpose Selection */}
              <div>
                <label htmlFor="purpose-select" className="block text-sm font-medium text-foreground mb-2">
                  Type of Inquiry
                </label>
                <div className="relative">
                  <select
                    id="purpose-select"
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
                <p className="text-xs text-accent mt-1">
                  → Sends to: {purposeOptions.find(p => p.value === formData.purpose)?.email}
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Your Name
                </label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`bg-background ${errors.name ? "border-destructive" : ""}`}
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
                  className={`bg-background ${errors.email ? "border-destructive" : ""}`}
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
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`bg-background resize-none ${errors.message ? "border-destructive" : ""}`}
                  rows={4}
                  required
                />
                {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
              </div>
              <p className="text-xs text-muted-foreground">
                Your message will be sent to the appropriate team and CC'd to info@ieosuia.com.
              </p>
              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-6">Contact Information</h3>
              <div className="space-y-4">
                {contactInfo.map((item) => (
                  item.purpose ? (
                    <button
                      key={item.label}
                      onClick={() => handleContactClick(item)}
                      className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border hover:border-accent/50 transition-colors group w-full text-left"
                    >
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all shrink-0">
                        <item.icon className="w-5 h-5 text-accent group-hover:text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="font-medium text-foreground break-words">{item.value}</p>
                      </div>
                    </button>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.isExternal ? "_blank" : undefined}
                      rel={item.isExternal ? "noopener noreferrer" : undefined}
                      className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border hover:border-accent/50 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all shrink-0">
                        <item.icon className="w-5 h-5 text-accent group-hover:text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="font-medium text-foreground break-words">{item.value}</p>
                      </div>
                    </a>
                  )
                ))}
                
                {/* Alternate phone */}
                <a
                  href="tel:+27631540696"
                  className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border hover:border-accent/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all shrink-0">
                    <Phone className="w-5 h-5 text-accent group-hover:text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Alternate Phone</p>
                    <p className="font-medium text-foreground break-words">+27 63 154 0696</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Quick Support */}
            <div className="bg-primary rounded-2xl p-6 text-primary-foreground">
              <h4 className="font-semibold mb-2">Need immediate help?</h4>
              <p className="text-primary-foreground/80 text-sm mb-4">
                Chat with our support team on WhatsApp for faster responses.
              </p>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I have a question about IEOSUIA Invoices & Books.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="accent" className="w-full">
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I have a question about IEOSUIA Invoices & Books.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
      >
        <MessageCircle className="w-7 h-7 text-white fill-white" />
      </a>
    </section>
  );
};

export default ContactSection;