import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, CheckCircle2, PlayCircle, X } from "lucide-react";

const HeroSection = () => {
  const [showDemo, setShowDemo] = useState(false);
  
  const highlights = [
    "No credit card required",
    "Free forever plan",
    "Setup in 2 minutes",
  ];

  return (
    <>
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 hero-gradient" />
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge - Removed "Trusted by 10,000+" */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              South Africa's Leading Invoicing Platform
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Professional Invoicing &<br />
              <span className="text-accent">Smart Bookkeeping</span>, Simplified
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Create beautiful invoices, track payments in real-time, and generate powerful reports—all from one intuitive platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/register">
                <Button size="xl" variant="accent" className="group">
                  Get Started for Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="xl" variant="hero-outline" className="group" onClick={() => setShowDemo(true)}>
                <PlayCircle className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {highlights.map((highlight) => (
                <div key={highlight} className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span className="text-sm">{highlight}</span>
                </div>
              ))}
            </div>

            {/* Dashboard Preview */}
            <div className="mt-16 relative animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="absolute -inset-4 bg-gradient-to-b from-accent/20 to-transparent rounded-2xl blur-2xl" />
              <div className="relative bg-card rounded-2xl shadow-float overflow-hidden border border-border/50">
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="p-6 bg-gradient-to-b from-background to-muted/30">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      { label: "Total Revenue", value: "R124,500", trend: "+12%" },
                      { label: "Outstanding", value: "R8,420", trend: "-5%" },
                      { label: "Paid Invoices", value: "156", trend: "+23%" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-card rounded-lg p-4 border border-border shadow-soft">
                        <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        <span className="text-xs text-success">{stat.trend}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                    Dashboard Preview
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Modal */}
      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>See IEOSUIA in Action</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="IEOSUIA Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HeroSection;
