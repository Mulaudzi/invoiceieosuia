import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, TestTube2 } from "lucide-react";
import ieosuiaLogo from "@/assets/ieosuia-invoices-logo.png";
import ieosuiaLogoWhite from "@/assets/ieosuia-invoices-logo-white.png";

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
  '/popia-compliance'
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
    { name: "Features", href: "/#features", isRoute: true },
    { name: "How It Works", href: "/#how-it-works", isRoute: true },
    { name: "Pricing", href: "/#pricing", isRoute: true },
    { name: "Contact", href: "/contact", isRoute: true },
  ];

  // Use dark styling when not scrolled (either on landing page or pages with dark headers)
  const useDarkStyling = !isScrolled;

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-lg border-b border-border shadow-sm" 
          : hasDarkHeader 
            ? "bg-primary border-b border-primary-foreground/10" 
            : "bg-transparent border-b border-white/10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={useDarkStyling ? ieosuiaLogoWhite : ieosuiaLogo} 
              alt="IEOSUIA Invoices Logo" 
              className="h-10 w-auto transition-all duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
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
          <div className="hidden md:flex items-center gap-3">
            <Link to="/tests">
              <Button 
                variant="ghost" 
                size="sm"
                className={useDarkStyling ? "text-white hover:bg-white/10 gap-1" : "gap-1"}
              >
                <TestTube2 className="w-4 h-4" />
                Tests
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                variant="ghost" 
                className={useDarkStyling ? "text-white hover:bg-white/10" : ""}
              >
                Login
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
            className={`md:hidden p-2 transition-colors ${useDarkStyling ? "text-white" : "text-foreground"}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className={`md:hidden py-4 border-t animate-fade-in ${
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
                <Link to="/tests" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" size="sm" className={`w-full gap-1 ${useDarkStyling ? "text-white" : ""}`}>
                    <TestTube2 className="w-4 h-4" />
                    Run Tests
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" className={`w-full ${useDarkStyling ? "text-white" : ""}`}>
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="accent" className="w-full">Get Started Free</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
