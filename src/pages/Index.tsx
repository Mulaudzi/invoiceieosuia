import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import AccountingComingSoonSection from "@/components/landing/AccountingComingSoonSection";
import Footer from "@/components/landing/Footer";
import { EcosystemSection } from "@/components/landing/EcosystemSection";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";

const Index = () => {
  const location = useLocation();

  // Handle hash navigation for smooth scrolling
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen overflow-x-hidden scroll-smooth">
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <AccountingComingSoonSection />
        <HowItWorksSection />
      </main>
      <EcosystemSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
