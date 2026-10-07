import { Link } from "react-router-dom";
import IEOSUIAInvoicesLogo from "@/components/branding/IEOSUIAInvoicesLogo";
import IEOSUIASocialLinks from "@/components/branding/IEOSUIASocialLinks";

const Footer = () => {
  const footerLinks = {
    "Quick Links": [
      { name: "Home", href: "/", isRoute: true },
      { name: "Features", href: "/features", isRoute: true },
      { name: "Online Invoicing", href: "/invoicing", isRoute: true },
      { name: "Payment Tracking", href: "/payment-tracking", isRoute: true },
      { name: "Contact", href: "/contact", isRoute: true },
      { name: "Login", href: "/login", isRoute: true },
    ],
    "Resources": [
      { name: "Support", href: "/support", isRoute: true },
      { name: "Documentation", href: "/documentation", isRoute: true },
      { name: "FAQ", href: "/faq", isRoute: true },
      { name: "Guides", href: "/documentation", isRoute: true },
    ],
    "Company": [
      { name: "About Us", href: "/#features" },
      { name: "Careers", href: "/careers", isRoute: true },
      { name: "Contact", href: "/contact", isRoute: true },
    ],
    "Legal": [
      { name: "Privacy Policy", href: "/privacy-policy", isRoute: true },
      { name: "Terms of Service", href: "/terms-of-service", isRoute: true },
      { name: "Cookie Policy", href: "/cookie-policy", isRoute: true },
      { name: "POPIA Compliance", href: "/popia-compliance", isRoute: true },
    ],
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <IEOSUIAInvoicesLogo variant="light" size="footer" />
            </Link>
            <p className="text-primary-foreground/70 text-sm mb-6 max-w-xs">
              Professional invoicing, document management and payment tracking for modern businesses.
            </p>

            {/* Social Links */}
            <IEOSUIASocialLinks linkClassName="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h2 className="font-semibold mb-4">{category}</h2>
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
            © {new Date().getFullYear()} IEOSUIA Invoices. All rights reserved.
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
            <Link to="/popia-compliance" className="text-primary-foreground/60 hover:text-accent text-sm transition-colors">
              POPIA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
