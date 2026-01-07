import { 
  FileText, 
  Users, 
  BarChart3, 
  Bell, 
  CreditCard, 
  Shield, 
  Zap, 
  Globe 
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: FileText,
      title: "Professional Invoices",
      description: "Create stunning invoices with customizable templates that reflect your brand identity.",
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Organize client information, track history, and build stronger relationships.",
    },
    {
      icon: BarChart3,
      title: "Smart Reports",
      description: "Get real-time insights into your business with powerful analytics and reporting tools.",
    },
    {
      icon: Bell,
      title: "Automated Reminders",
      description: "Never chase payments again with automatic email and SMS payment reminders.",
    },
    {
      icon: CreditCard,
      title: "Payment Tracking",
      description: "Track payments in real-time and know exactly what's outstanding at a glance.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-grade security ensures your data is always protected and accessible.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate invoices in seconds with our intuitive, streamlined interface.",
    },
    {
      icon: Globe,
      title: "Multi-Currency",
      description: "Work with clients worldwide with support for 100+ currencies and languages.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to <span className="text-accent">Get Paid Faster</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From creating invoices to tracking payments, we've got all the tools to streamline your billing workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 bg-card rounded-xl border border-border card-hover animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
