import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "@/lib/icons";
import IEOSUIAInvoicesLogo from "@/components/branding/IEOSUIAInvoicesLogo";

// Pages that have dark headers (PageHeader component with bg-primary)
const DARK_HEADER_PAGES = [
  '/support',
  '/faq',
  '/documentation',
  '/careers',
  '/privacy-policy',
  '/terms-of-service',
  '/cookie-policy',
  '/contact',
  '/popia-compliance',
  '/features',
  '/invoicing',
  '/quotes',
  '/payment-tracking',
  '/client-management',
  '/products-and-services',
  '/reports',
  '/accounting',
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Check if current page has a dark header
  const hasDarkHeader = DARK_HEADER_PAGES.includes(location.pathname);
  
  // For pages with dark headers, threshold is much smaller (just past the header)
  const scrollThreshold = hasDarkHeader ? 150 : window.innerHeight * 0.85;

  useEffect(() => {
    const handleScroll = () => {
      const threshold = hasDarkHeader ? 150 : window.innerHeight * 0.85;
      setIsScrolled(window.scrollY > threshold);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasDarkHeader]);

  const navLinks = [
    { name: "Product", href: "/invoicing", isRoute: true },
    { name: "Features", href: "/features", isRoute: true },
    { name: "Quotes", href: "/quotes", isRoute: true },
    { name: "Accounting", href: "/accounting", isRoute: true },
    { name: "Support", href: "/support", isRoute: true },
    { name: "Contact", href: "/contact", isRoute: true },
  ];

  // Use dark styling when not scrolled (either on landing page or pages with dark headers)
  const useDarkStyling = !isScrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-lg border-b border-border shadow-sm" 
          : hasDarkHeader 
            ? "bg-primary border-b border-primary-foreground/10" 
            : "bg-transparent border-b border-white/10"
      }`}
    >
      <nav className="container mx-auto px-4" aria-label="Primary navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <IEOSUIAInvoicesLogo
              variant={useDarkStyling ? "light" : "standard"}
              size="header"
              className="transition-all duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`transition-colors animated-underline ${
                    useDarkStyling 
                      ? "text-white/80 hover:text-white" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className={`transition-colors animated-underline ${
                    useDarkStyling 
                      ? "text-white/80 hover:text-white" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.name}
                </a>
              )
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/login">
              <Button 
                variant="ghost" 
                className={useDarkStyling ? "text-white hover:bg-white/10" : ""}
              >
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="accent" className="shadow-glow">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 transition-colors ${useDarkStyling ? "text-white" : "text-foreground"}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className={`lg:hidden py-4 border-t animate-fade-in ${
            useDarkStyling ? "border-white/10 bg-primary/95 backdrop-blur-lg" : "border-border bg-white"
          }`}>
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`transition-colors px-2 py-1 ${
                      useDarkStyling 
                        ? "text-white/80 hover:text-white" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    className={`transition-colors px-2 py-1 ${
                      useDarkStyling 
                        ? "text-white/80 hover:text-white" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                )
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link to="/login">
                  <Button variant="ghost" className={`w-full ${useDarkStyling ? "text-white" : ""}`}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="accent" className="w-full">Get Started Free</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
