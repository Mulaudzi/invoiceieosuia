import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Crown, Mail, MessageSquare, FileText, ArrowRight } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Free",
      price: "R0",
      period: "forever",
      description: "Perfect for freelancers just getting started",
      features: [
        { text: "20 emails/month (Free)", icon: Mail, highlight: true },
        { text: "0 SMS/month", icon: MessageSquare },
        { text: "Up to 30 invoices/month", icon: FileText },
        { text: "3 invoice templates" },
        { text: "Basic payment tracking" },
        { text: "Email support" },
        { text: "IEOSUIA branding on invoices" },
      ],
      cta: "Get Started Free",
      href: "/register",
      variant: "outline" as const,
      popular: false,
      icon: null,
    },
    {
      name: "Solo",
      price: "R149",
      period: "per month",
      description: "For solo entrepreneurs and consultants",
      features: [
        { text: "50 emails/month @ R0.10 each", icon: Mail, highlight: true },
        { text: "10 SMS/month @ R0.25 each", icon: MessageSquare, highlight: true },
        { text: "Unlimited invoices", icon: FileText },
        { text: "Custom templates & branding" },
        { text: "Manual reminders" },
        { text: "Basic reports" },
        { text: "Remove IEOSUIA branding" },
      ],
      cta: "Start Free Trial",
      href: "/register?plan=solo",
      variant: "default" as const,
      popular: false,
      icon: Zap,
    },
    {
      name: "Pro",
      price: "R299",
      period: "per month",
      description: "For growing businesses and agencies",
      features: [
        { text: "100 emails/month @ R0.10 each", icon: Mail, highlight: true },
        { text: "25 SMS/month @ R0.24 each", icon: MessageSquare, highlight: true },
        { text: "Unlimited invoices", icon: FileText },
        { text: "All templates + custom branding" },
        { text: "Automated payment reminders" },
        { text: "Advanced reports & analytics" },
        { text: "Priority support" },
        { text: "Recurring invoices" },
      ],
      cta: "Start Free Trial",
      href: "/register?plan=pro",
      variant: "accent" as const,
      popular: true,
      icon: Star,
    },
    {
      name: "Business",
      price: "R599",
      period: "per month",
      description: "For teams and enterprises",
      features: [
        { text: "200 emails/month @ R0.10 each", icon: Mail, highlight: true },
        { text: "50 SMS/month @ R0.23 each", icon: MessageSquare, highlight: true },
        { text: "Unlimited invoices", icon: FileText },
        { text: "Everything in Pro" },
        { text: "Multi-user access (up to 10)" },
        { text: "Role-based permissions" },
        { text: "Multi-business support" },
        { text: "Full ledger & bookkeeping" },
        { text: "White-label solution" },
        { text: "Dedicated account manager" },
      ],
      cta: "Contact Sales",
      href: "mailto:info@ieosuia.com?subject=Business Plan Inquiry",
      variant: "default" as const,
      popular: false,
      isExternal: true,
      icon: Crown,
    },
  ];

  return (
    <section id="pricing" className="py-16 bg-gradient-to-b from-background to-secondary/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent <span className="text-accent">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free and scale as you grow. No hidden fees, no surprises. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col animate-fade-in ${
                plan.popular
                  ? "bg-primary text-primary-foreground border-2 border-accent shadow-glow lg:scale-105 lg:-my-4"
                  : "bg-card text-card-foreground border border-border shadow-soft hover:shadow-lg transition-shadow"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium flex items-center gap-1.5 shadow-lg">
                  <Star className="w-4 h-4 fill-current" />
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6 pt-2">
                {plan.icon && (
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                    plan.popular ? "bg-accent/20" : "bg-accent/10"
                  }`}>
                    <plan.icon className={`w-6 h-6 ${plan.popular ? "text-accent" : "text-accent"}`} />
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {typeof feature === 'object' && feature.icon ? (
                      <feature.icon className={`w-5 h-5 shrink-0 ${
                        feature.highlight 
                          ? plan.popular ? "text-accent" : "text-accent" 
                          : plan.popular ? "text-accent" : "text-accent"
                      }`} />
                    ) : (
                      <Check className={`w-5 h-5 shrink-0 ${plan.popular ? "text-accent" : "text-accent"}`} />
                    )}
                    <span className={`text-sm ${
                      typeof feature === 'object' && feature.highlight 
                        ? "font-medium" 
                        : ""
                    } ${plan.popular ? "text-primary-foreground/90" : "text-foreground"}`}>
                      {typeof feature === 'object' ? feature.text : feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.isExternal ? (
                <a href={plan.href}>
                  <Button
                    variant={plan.variant}
                    size="lg"
                    className="w-full group"
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              ) : (
                <Link to={plan.href}>
                  <Button
                    variant={plan.popular ? "accent" : plan.variant}
                    size="lg"
                    className="w-full group"
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Per-unit pricing note */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 px-6 py-3 rounded-full bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Emails:</span>
              <span className="font-semibold text-foreground">R0.10 each</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">SMS:</span>
              <span className="font-semibold text-foreground">From R0.23</span>
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Need a custom solution for your enterprise?
          </p>
          <a href="mailto:info@ieosuia.com?subject=Enterprise Inquiry">
            <Button variant="outline" size="lg">
              Contact us for Enterprise pricing
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
