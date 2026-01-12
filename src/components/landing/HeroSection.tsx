import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles, Globe, Zap, Shield, TrendingUp } from "lucide-react";

const HeroSection = () => {
  const [showDemo, setShowDemo] = useState(false);
  
  const highlights = [
    "No credit card required",
    "Free forever plan",
    "Setup in 2 minutes",
  ];

  const stats = [
    { value: "10K+", label: "Invoices Sent" },
    { value: "R2M+", label: "Processed" },
    { value: "99.9%", label: "Uptime" },
  ];

  return (
    <>
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 hero-gradient" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-float opacity-60" />
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-float opacity-40" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-4 relative z-10 pt-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center">
              {/* Announcement Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8 animate-fade-in mt-8">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>South Africa's Leading Invoicing Platform</span>
                <span className="px-2 py-0.5 bg-accent/20 rounded-full text-accent text-xs font-medium">New</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in leading-tight" style={{ animationDelay: "0.1s" }}>
                Send Unlimited Invoices.
                <br />
                <span className="text-accent">Get Paid Faster.</span> Anywhere.
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-3xl mx-auto animate-fade-in leading-relaxed" style={{ animationDelay: "0.2s" }}>
                IEOSUIA Invoices helps freelancers, businesses, and teams automate, track, and customize invoices in ZAR or your preferred currency—with email & SMS reminders built-in.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <Link to="/register">
                  <Button size="xl" variant="accent" className="group text-base px-8 py-6 shadow-glow">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="xl" variant="hero-outline" className="group text-base px-8 py-6" onClick={() => setShowDemo(true)}>
                  <PlayCircle className="w-5 h-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Highlights */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                {highlights.map((highlight) => (
                  <div key={highlight} className="flex items-center gap-2 text-white/80">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    <span className="text-sm font-medium">{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-16 animate-fade-in" style={{ animationDelay: "0.5s" }}>
                {[
                  { icon: Globe, label: "Multi-Currency" },
                  { icon: Zap, label: "Auto Reminders" },
                  { icon: Shield, label: "Bank-Grade Security" },
                  { icon: TrendingUp, label: "Smart Reports" },
                ].map((feature) => (
                  <div key={feature.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                    <feature.icon className="w-4 h-4 text-accent" />
                    {feature.label}
                  </div>
                ))}
              </div>

              {/* Dashboard Preview */}
              <div className="relative animate-fade-in" style={{ animationDelay: "0.6s" }}>
                <div className="absolute -inset-4 bg-gradient-to-b from-accent/30 to-transparent rounded-3xl blur-3xl" />
                <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                  {/* Browser Chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-background/50 border-b border-border/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/60" />
                      <div className="w-3 h-3 rounded-full bg-warning/60" />
                      <div className="w-3 h-3 rounded-full bg-success/60" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-6 bg-muted/50 rounded-md w-64 mx-auto" />
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="p-6 bg-gradient-to-b from-background to-muted/20">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: "Total Revenue", value: "R124,500", trend: "+12%", color: "text-success" },
                        { label: "Outstanding", value: "R8,420", trend: "-5%", color: "text-success" },
                        { label: "Paid Invoices", value: "156", trend: "+23%", color: "text-success" },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-card rounded-xl p-4 border border-border/50 shadow-soft">
                          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-xl font-bold text-foreground">{stat.value}</p>
                            <span className={`text-xs font-medium ${stat.color}`}>{stat.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Chart placeholder */}
                    <div className="h-40 bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl border border-border/30 flex items-end justify-around px-4 pb-4">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                        <div 
                          key={i}
                          className="w-4 bg-accent/60 rounded-t-sm"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-12 mt-12 animate-fade-in" style={{ animationDelay: "0.7s" }}>
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-white/60">{stat.label}</p>
                  </div>
                ))}
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
