import { Link } from "react-router-dom";
import { FileText, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    "Quick Links": [
      { name: "Home", href: "/", isRoute: true },
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Contact", href: "#contact" },
      { name: "Login", href: "/login", isRoute: true },
    ],
    Resources: [
      { name: "Support", href: "/support", isRoute: true },
      { name: "FAQ", href: "/support", isRoute: true },
      { name: "Documentation", href: "#" },
    ],
    Legal: [
      { name: "Privacy Policy", href: "/privacy-policy", isRoute: true },
      { name: "Terms of Service", href: "/terms-of-service", isRoute: true },
      { name: "Cookie Policy", href: "/cookie-policy", isRoute: true },
    ],
  };

  const contactInfo = {
    email: "info@ieosuia.com",
    phone: "+27 63 808 2493",
    address: "3116 Rock Alder, Extension 15, Naturena, Johannesburg South, Gauteng, 2095",
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">
                IEOSUIA<span className="text-accent">.</span>
              </span>
            </Link>
            <p className="text-primary-foreground/70 text-sm mb-6 max-w-xs">
              Professional invoicing and smart bookkeeping made simple for South African businesses.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a 
                href={`mailto:${contactInfo.email}`}
                className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
              >
                <Mail className="w-4 h-4" />
                {contactInfo.email}
              </a>
              <a 
                href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
              >
                <Phone className="w-4 h-4" />
                {contactInfo.phone}
              </a>
              <div className="flex items-start gap-2 text-sm text-primary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{contactInfo.address}</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.isRoute ? (
                      <Link
                        to={link.href}
                        className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} IEOSUIA Invoices & Books. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-primary-foreground/60 hover:text-accent text-sm transition-colors">
              Privacy
            </Link>
            <Link to="/terms-of-service" className="text-primary-foreground/60 hover:text-accent text-sm transition-colors">
              Terms
            </Link>
            <Link to="/cookie-policy" className="text-primary-foreground/60 hover:text-accent text-sm transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
