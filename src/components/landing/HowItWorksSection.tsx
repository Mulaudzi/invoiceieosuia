import { Building2, Users, FileText, TrendingUp } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      step: 1,
      icon: Building2,
      title: "Create Your Account",
      description: "Sign up in seconds with your email. Set up your business profile and branding preferences.",
    },
    {
      step: 2,
      icon: Users,
      title: "Add Clients & Products",
      description: "Import your client list or add them manually. Define your products and services with pricing.",
    },
    {
      step: 3,
      icon: FileText,
      title: "Generate Invoices",
      description: "Create professional invoices with customizable templates. Send them instantly via email.",
    },
    {
      step: 4,
      icon: TrendingUp,
      title: "Track & Grow",
      description: "Monitor payments, automate reminders, and use insights to grow your business.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get Started in <span className="text-accent">4 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From signup to your first invoice, it takes less than 5 minutes to get up and running.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Step Card */}
                <div className="bg-card rounded-xl p-6 border border-border shadow-soft relative z-10 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shadow-glow">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center mb-4 mt-2">
                    <step.icon className="w-7 h-7 text-accent" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
