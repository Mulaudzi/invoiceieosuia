import { 
  FileText, 
  Users, 
  BarChart3, 
  Bell, 
  CreditCard, 
  Shield, 
  Zap, 
  Globe,
  Mail,
  MessageSquare,
  Palette,
  RefreshCw,
} from "lucide-react";

const FeaturesSection = () => {
  const mainFeatures = [
    {
      icon: FileText,
      title: "Unlimited Invoices",
      description: "Send as many invoices as you need. No limits, no stress. Create professional invoices in seconds.",
      highlight: true,
    },
    {
      icon: Palette,
      title: "Custom Templates & Branding",
      description: "Paid plans let you create fully branded invoices that match your business identity perfectly.",
    },
    {
      icon: Bell,
      title: "Automated Reminders",
      description: "Never chase payments again. Email and SMS notifications ensure clients never miss a payment.",
    },
    {
      icon: Globe,
      title: "Multi-Currency Support",
      description: "Invoice in ZAR, USD, EUR, GBP, AUD, or CAD. All transactions handled seamlessly.",
    },
  ];

  const additionalFeatures = [
    {
      icon: Users,
      title: "Team & Business Features",
      description: "Multi-user access, role permissions, and ledger support for growing businesses.",
    },
    {
      icon: BarChart3,
      title: "Smart Reports",
      description: "Get real-time insights into your business with powerful analytics and reporting tools.",
    },
    {
      icon: CreditCard,
      title: "Payment Tracking",
      description: "Track payments in real-time and know exactly what's outstanding at a glance.",
    },
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Your data is always protected with enterprise-level encryption and security.",
    },
    {
      icon: Mail,
      title: "Email Notifications",
      description: "Send professional invoice emails directly to clients with custom messages.",
    },
    {
      icon: MessageSquare,
      title: "SMS Reminders",
      description: "Reach clients instantly with SMS payment reminders for faster payments.",
    },
    {
      icon: RefreshCw,
      title: "Recurring Invoices",
      description: "Automate billing with scheduled recurring invoices for retainer clients.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate invoices in seconds with our intuitive, streamlined interface.",
    },
  ];

  return (
    <section id="features" className="py-16 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="text-accent">Get Paid Faster</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From creating invoices to tracking payments, we've got all the tools to streamline your billing workflow and grow your business.
          </p>
        </div>

        {/* Main Features - Larger Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {mainFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-8 rounded-2xl border transition-all duration-300 animate-fade-in ${
                feature.highlight 
                  ? "bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30 hover:border-accent/50" 
                  : "bg-card border-border hover:border-accent/30 hover:shadow-lg"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${
                feature.highlight 
                  ? "bg-accent text-accent-foreground" 
                  : "bg-accent/10 group-hover:bg-accent group-hover:scale-110"
              }`}>
                <feature.icon className={`w-7 h-7 ${feature.highlight ? "" : "text-accent group-hover:text-accent-foreground"}`} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Features - Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {additionalFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 bg-card rounded-xl border border-border hover:border-accent/30 hover:shadow-md transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${(index + 4) * 0.05}s` }}
            >
              <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-5 h-5 text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
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