import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Crown, Mail, MessageSquare, FileText, ArrowRight, X, Users, Repeat, BarChart3, Palette, Bell, Shield, Headphones, Building2, ChevronDown, ChevronUp } from "lucide-react";
import PricingFAQ from "./PricingFAQ";

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [showFeatureComparison, setShowFeatureComparison] = useState(false);
  
  // 20% discount for annual billing
  const annualDiscount = 0.20;
  
  const getPrice = (monthlyPrice: number) => {
    if (isAnnual) {
      const discountedMonthly = monthlyPrice * (1 - annualDiscount);
      return Math.round(discountedMonthly);
    }
    return monthlyPrice;
  };

  const plans = [
    {
      name: "Free",
      monthlyPrice: 0,
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
      monthlyPrice: 149,
      price: `R${getPrice(149)}`,
      period: isAnnual ? "per month, billed annually" : "per month",
      description: "For solo entrepreneurs and consultants",
      features: [
        { text: "50 emails/month @ R0.10 each", icon: Mail, highlight: true },
        { text: "10 SMS/month @ R0.25 each", icon: MessageSquare, highlight: true },
        { text: "Unlimited invoices", icon: FileText },
        { text: "12 eInvoice templates" },
        { text: "Custom branding" },
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
      monthlyPrice: 299,
      price: `R${getPrice(299)}`,
      period: isAnnual ? "per month, billed annually" : "per month",
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
      monthlyPrice: 599,
      price: `R${getPrice(599)}`,
      period: isAnnual ? "per month, billed annually" : "per month",
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
        <div className="text-center max-w-3xl mx-auto mb-8">
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

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isAnnual ? 'bg-accent' : 'bg-muted'
            }`}
            aria-label="Toggle annual billing"
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                isAnnual ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annual
          </span>
          {isAnnual && (
            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold animate-fade-in">
              Save 20%
            </span>
          )}
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
        <div className="mt-12 text-center space-y-3">
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
          <p className="text-xs text-muted-foreground">
            SMS reminders use your SMS credits. Top up anytime from your dashboard.
          </p>
        </div>

        {/* Detailed Feature Comparison Toggle */}
        <div className="mt-12 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFeatureComparison(!showFeatureComparison)}
            className="group"
          >
            {showFeatureComparison ? "Hide" : "Compare All"} Features
            {showFeatureComparison ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>

        {/* Detailed Feature Comparison */}
        {showFeatureComparison && (
        <div className="mt-10 max-w-6xl mx-auto animate-fade-in">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Compare All <span className="text-accent">Features</span>
            </h3>
            <p className="text-muted-foreground">
              See exactly what's included in each plan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-foreground font-semibold min-w-[200px]">Features</th>
                  <th className="text-center py-4 px-4 text-foreground font-semibold min-w-[120px]">Free</th>
                  <th className="text-center py-4 px-4 text-foreground font-semibold min-w-[120px]">Solo</th>
                  <th className="text-center py-4 px-4 min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <span className="text-accent font-bold">Pro</span>
                      <span className="text-xs text-accent/80">Popular</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 text-foreground font-semibold min-w-[120px]">Business</th>
                </tr>
              </thead>
              <tbody>
                {/* Communications */}
                <tr className="bg-muted/30">
                  <td colSpan={5} className="py-3 px-4">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Mail className="w-4 h-4 text-accent" />
                      Communications
                    </div>
                  </td>
                </tr>
                <FeatureRow 
                  feature="Monthly emails included" 
                  free="20" 
                  solo="50" 
                  pro="100" 
                  business="200" 
                />
                <FeatureRow 
                  feature="Monthly SMS included" 
                  free="0" 
                  solo="10" 
                  pro="25" 
                  business="50" 
                />
                <FeatureRow 
                  feature="Additional email cost" 
                  free="—" 
                  solo="R0.10" 
                  pro="R0.10" 
                  business="R0.10" 
                />
                <FeatureRow 
                  feature="Additional SMS cost" 
                  free="—" 
                  solo="R0.25" 
                  pro="R0.24" 
                  business="R0.23" 
                />

                {/* Invoicing */}
                <tr className="bg-muted/30">
                  <td colSpan={5} className="py-3 px-4">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <FileText className="w-4 h-4 text-accent" />
                      Invoicing
                    </div>
                  </td>
                </tr>
                <FeatureRow 
                  feature="Monthly invoices" 
                  free="30" 
                  solo={true} 
                  pro={true} 
                  business={true} 
                  unlimitedLabel="Unlimited"
                />
                <FeatureRow 
                  feature="eInvoice templates" 
                  free="3" 
                  solo="12" 
                  pro="All" 
                  business="All" 
                />
                <FeatureRow 
                  feature="Custom branding" 
                  free={false} 
                  solo={true} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Remove IEOSUIA branding" 
                  free={false} 
                  solo={true} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Recurring invoices" 
                  free={false} 
                  solo={false} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="PDF downloads" 
                  free={true} 
                  solo={true} 
                  pro={true} 
                  business={true} 
                />

                {/* Reminders & Automation */}
                <tr className="bg-muted/30">
                  <td colSpan={5} className="py-3 px-4">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Bell className="w-4 h-4 text-accent" />
                      Reminders & Automation
                    </div>
                  </td>
                </tr>
                <FeatureRow 
                  feature="Manual reminders" 
                  free={false} 
                  solo={true} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Automated reminders" 
                  free={false} 
                  solo={false} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Scheduled reminders" 
                  free={false} 
                  solo={false} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Payment due notifications" 
                  free={false} 
                  solo={true} 
                  pro={true} 
                  business={true} 
                />

                {/* Reports & Analytics */}
                <tr className="bg-muted/30">
                  <td colSpan={5} className="py-3 px-4">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <BarChart3 className="w-4 h-4 text-accent" />
                      Reports & Analytics
                    </div>
                  </td>
                </tr>
                <FeatureRow 
                  feature="Basic payment tracking" 
                  free={true} 
                  solo={true} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Basic reports" 
                  free={false} 
                  solo={true} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Advanced analytics" 
                  free={false} 
                  solo={false} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Revenue forecasting" 
                  free={false} 
                  solo={false} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Full ledger & bookkeeping" 
                  free={false} 
                  solo={false} 
                  pro={false} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Export to CSV/PDF" 
                  free={false} 
                  solo={true} 
                  pro={true} 
                  business={true} 
                />

                {/* Team & Business */}
                <tr className="bg-muted/30">
                  <td colSpan={5} className="py-3 px-4">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Users className="w-4 h-4 text-accent" />
                      Team & Business
                    </div>
                  </td>
                </tr>
                <FeatureRow 
                  feature="Team members" 
                  free="1" 
                  solo="1" 
                  pro="3" 
                  business="10" 
                />
                <FeatureRow 
                  feature="Role-based permissions" 
                  free={false} 
                  solo={false} 
                  pro={false} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Multi-business support" 
                  free={false} 
                  solo={false} 
                  pro={false} 
                  business={true} 
                />
                <FeatureRow 
                  feature="White-label solution" 
                  free={false} 
                  solo={false} 
                  pro={false} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Client portal" 
                  free={false} 
                  solo={false} 
                  pro={true} 
                  business={true} 
                />

                {/* Support */}
                <tr className="bg-muted/30">
                  <td colSpan={5} className="py-3 px-4">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Headphones className="w-4 h-4 text-accent" />
                      Support
                    </div>
                  </td>
                </tr>
                <FeatureRow 
                  feature="Email support" 
                  free={true} 
                  solo={true} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Priority support" 
                  free={false} 
                  solo={false} 
                  pro={true} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Dedicated account manager" 
                  free={false} 
                  solo={false} 
                  pro={false} 
                  business={true} 
                />
                <FeatureRow 
                  feature="Phone support" 
                  free={false} 
                  solo={false} 
                  pro={false} 
                  business={true} 
                />
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Enterprise CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border">
            <Building2 className="w-10 h-10 text-accent" />
            <div>
              <p className="text-lg font-semibold text-foreground mb-1">
                Need a custom solution for your enterprise?
              </p>
              <p className="text-muted-foreground text-sm">
                Get custom limits, dedicated infrastructure, and priority support
              </p>
            </div>
            <a href="mailto:hello@ieosuia.com?subject=Enterprise Inquiry">
              <Button variant="outline" size="lg" className="group">
                Contact us for Enterprise pricing
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </div>
        </div>

        {/* Pricing FAQ */}
        <PricingFAQ />
      </div>
    </section>
  );
};

// Feature row component for the comparison table
const FeatureRow = ({ 
  feature, 
  free, 
  solo, 
  pro, 
  business,
  unlimitedLabel = "Unlimited"
}: { 
  feature: string; 
  free: boolean | string; 
  solo: boolean | string; 
  pro: boolean | string; 
  business: boolean | string;
  unlimitedLabel?: string;
}) => {
  const renderValue = (value: boolean | string, isProColumn = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className={`w-5 h-5 mx-auto ${isProColumn ? 'text-accent' : 'text-green-500'}`} />
      ) : (
        <X className="w-5 h-5 mx-auto text-muted-foreground/50" />
      );
    }
    return <span className={`text-sm ${isProColumn ? 'font-medium text-accent' : 'text-foreground'}`}>{value}</span>;
  };

  return (
    <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
      <td className="py-3 px-4 text-sm text-foreground">{feature}</td>
      <td className="py-3 px-4 text-center">{renderValue(free)}</td>
      <td className="py-3 px-4 text-center">{renderValue(solo)}</td>
      <td className="py-3 px-4 text-center bg-accent/5">{renderValue(pro, true)}</td>
      <td className="py-3 px-4 text-center">{renderValue(business)}</td>
    </tr>
  );
};

export default PricingSection;
