import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import ieosuiaLogo from "@/assets/ieosuia-logo.png";

const Footer = () => {
  const footerLinks = {
    "Quick Links": [
      { name: "Home", href: "/", isRoute: true },
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/#pricing" },
      { name: "Contact", href: "/#contact" },
      { name: "Login", href: "/login", isRoute: true },
    ],
    "Resources": [
      { name: "Support", href: "/support", isRoute: true },
      { name: "Documentation", href: "/documentation", isRoute: true },
      { name: "FAQ", href: "/support", isRoute: true },
      { name: "Tutorials", href: "https://www.youtube.com/@ieosuia", isExternal: true },
    ],
    "Company": [
      { name: "About Us", href: "/#features" },
      { name: "Careers", href: "/careers", isRoute: true },
    ],
    "Legal": [
      { name: "Privacy Policy", href: "/privacy-policy", isRoute: true },
      { name: "Terms of Service", href: "/terms-of-service", isRoute: true },
      { name: "Cookie Policy", href: "/cookie-policy", isRoute: true },
      { name: "POPIA Compliance", href: "/privacy-policy", isRoute: true },
    ],
  };

  const contactInfo = {
    email: "hello@ieosuia.com",
    supportEmail: "support@ieosuia.com",
    phone: "+27 79 928 2775",
    altPhone: "+27 63 154 0696",
    whatsapp: "+27 63 808 2493",
    address: "26 Rock Alder, Extension 15, Naturena, Johannesburg, 2095",
  };

  const socialLinks = [
    { name: "YouTube", href: "https://www.youtube.com/@ieosuia", icon: "youtube" },
    { name: "WhatsApp", href: `https://wa.me/27638082493`, icon: "whatsapp" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src={ieosuiaLogo} 
                alt="IEOSUIA Logo" 
                className="h-10 w-auto"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-tight">
                  IEOSUIA<span className="text-accent">.</span>
                </span>
                <span className="text-xs text-primary-foreground/60 leading-tight">
                  Invoices & Books
                </span>
              </div>
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
                href={`mailto:${contactInfo.supportEmail}`}
                className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
              >
                <Mail className="w-4 h-4" />
                {contactInfo.supportEmail}
              </a>
              <a 
                href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
              >
                <Phone className="w-4 h-4" />
                {contactInfo.phone} (Calls)
              </a>
              <a 
                href={`tel:${contactInfo.altPhone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
              >
                <Phone className="w-4 h-4" />
                {contactInfo.altPhone} (Alternate)
              </a>
              <div className="flex items-start gap-2 text-sm text-primary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{contactInfo.address}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4 mt-6">
              <a 
                href="https://www.youtube.com/@ieosuia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a 
                href={`https://wa.me/27638082493`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#25D366] transition-colors"
                aria-label="WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
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
                    ) : link.isExternal ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                      >
                        {link.name}
                      </a>
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
