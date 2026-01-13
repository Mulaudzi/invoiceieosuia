import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import ieosuiaLogo from "@/assets/ieosuia-invoices-logo.png";
import ieosuiaLogoWhite from "@/assets/ieosuia-invoices-logo-white.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Get hero section height (approximately viewport height)
      const heroHeight = window.innerHeight * 0.85;
      setIsScrolled(window.scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Contact", href: "/contact", isRoute: true },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-lg border-b border-border shadow-sm" 
          : "bg-transparent border-b border-white/10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={isScrolled ? ieosuiaLogo : ieosuiaLogoWhite} 
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
                    isScrolled 
                      ? "text-muted-foreground hover:text-foreground" 
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className={`transition-colors animated-underline ${
                    isScrolled 
                      ? "text-muted-foreground hover:text-foreground" 
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.name}
                </a>
              )
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button 
                variant={isScrolled ? "ghost" : "ghost"} 
                className={isScrolled ? "" : "text-white hover:bg-white/10"}
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
            className={`md:hidden p-2 transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className={`md:hidden py-4 border-t animate-fade-in ${
            isScrolled ? "border-border bg-white" : "border-white/10 bg-primary/95 backdrop-blur-lg"
          }`}>
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`transition-colors px-2 py-1 ${
                      isScrolled 
                        ? "text-muted-foreground hover:text-foreground" 
                        : "text-white/80 hover:text-white"
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
                      isScrolled 
                        ? "text-muted-foreground hover:text-foreground" 
                        : "text-white/80 hover:text-white"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                )
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link to="/login">
                  <Button variant="ghost" className={`w-full ${isScrolled ? "" : "text-white"}`}>
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
