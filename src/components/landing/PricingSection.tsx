import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

const PricingSection = () => {
const plans = [
    {
      name: "Free",
      price: "R0",
      period: "forever",
      description: "Perfect for freelancers just getting started",
      features: [
        "Up to 30 invoices/month",
        "3 invoice templates",
        "Basic payment tracking",
        "Email support",
        "IEOSUIA branding on invoices",
      ],
      cta: "Get Started Free",
      variant: "outline" as const,
      popular: false,
    },
    {
      name: "Pro",
      price: "R349",
      period: "per month",
      description: "For growing businesses and agencies",
      features: [
        "Unlimited invoices",
        "All templates + custom branding",
        "Automated payment reminders",
        "SMS & email notifications",
        "Advanced reports & analytics",
        "Priority support",
        "Remove IEOSUIA branding",
      ],
      cta: "Start 14-Day Trial",
      variant: "accent" as const,
      popular: true,
    },
    {
      name: "Business",
      price: "R899",
      period: "per month",
      description: "For teams and enterprises",
      features: [
        "Everything in Pro",
        "Multi-user access (up to 10)",
        "Role-based permissions",
        "Multi-business support",
        "Full ledger & bookkeeping",
        "API access",
        "White-label solution",
        "Dedicated account manager",
      ],
      cta: "Contact Sales",
      variant: "default" as const,
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent <span className="text-accent">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 animate-fade-in ${
                plan.popular
                  ? "bg-primary text-primary-foreground border-2 border-accent shadow-glow scale-105"
                  : "bg-card text-card-foreground border border-border shadow-soft"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
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
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${plan.popular ? "text-accent" : "text-accent"}`} />
                    <span className={`text-sm ${plan.popular ? "text-primary-foreground/90" : "text-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/register">
                <Button
                  variant={plan.popular ? "accent" : plan.variant}
                  size="lg"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
