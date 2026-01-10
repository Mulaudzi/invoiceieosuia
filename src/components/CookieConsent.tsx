import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie_consent";

type ConsentType = "all" | "essential" | null;

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (type: ConsentType) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, type || "essential");
    setIsVisible(false);
    
    // Here you could trigger analytics initialization based on consent
    if (type === "all") {
      // Initialize analytics, marketing cookies, etc.
      console.log("All cookies accepted");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-background border rounded-xl shadow-lg p-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">We use cookies</h3>
                  <p className="text-muted-foreground text-sm">
                    We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic. 
                    By clicking "Accept All", you consent to our use of cookies.{" "}
                    <Link to="/cookie-policy" className="text-primary hover:underline">
                      Learn more
                    </Link>
                  </p>
                </div>
                <button 
                  onClick={() => handleConsent("essential")}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {showDetails && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Essential Cookies</p>
                      <p className="text-muted-foreground text-xs">Required for the website to function</p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Always Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Analytics Cookies</p>
                      <p className="text-muted-foreground text-xs">Help us understand how visitors interact</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Functional Cookies</p>
                      <p className="text-muted-foreground text-xs">Remember your preferences</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Button onClick={() => handleConsent("all")} size="sm">
                  Accept All
                </Button>
                <Button onClick={() => handleConsent("essential")} variant="outline" size="sm">
                  Essential Only
                </Button>
                <Button 
                  onClick={() => setShowDetails(!showDetails)} 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground"
                >
                  {showDetails ? "Hide Details" : "Cookie Settings"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
