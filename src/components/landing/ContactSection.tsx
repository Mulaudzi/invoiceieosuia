import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({ name: "", email: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "info@ieosuia.com",
      href: "mailto:info@ieosuia.com",
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+27 63 808 2493",
      href: "tel:+27638082493",
    },
    {
      icon: MapPin,
      label: "Address",
      value: "3116 Rock Alder, Extension 15, Naturena, Johannesburg South, Gauteng, 2095, South Africa",
      href: "https://maps.google.com/?q=3116+Rock+Alder+Extension+15+Naturena+Johannesburg+South+Gauteng+2095+South+Africa",
    },
  ];

  const whatsappNumber = "27638082493";

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
          <div className="bg-card rounded-2xl p-8 border border-border shadow-soft">
            <h3 className="text-xl font-semibold text-foreground mb-6">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Your Name
                </label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-background"
                />
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
                  required
                  className="bg-background"
                />
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
                  required
                  rows={4}
                  className="bg-background resize-none"
                />
              </div>
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
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.label === "Address" ? "_blank" : undefined}
                    rel={item.label === "Address" ? "noopener noreferrer" : undefined}
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
                ))}
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
