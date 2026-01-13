import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCredits, usePlans } from "@/hooks/useCredits";
import { useBillingHistory } from "@/hooks/useReports";
import { useAuth } from "@/contexts/AuthContext";
import { usePayfastCheckout } from "@/hooks/usePayfast";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/api";
import { PaymentRetryStatus } from "@/components/billing/PaymentRetryStatus";
import {
  CreditCard,
  Check,
  Star,
  Zap,
  Crown,
  ArrowRight,
  Mail,
  MessageSquare,
  FileText,
  Users,
  BarChart3,
  Palette,
  Bell,
  Shield,
  Loader2,
  CheckCircle,
  Calendar,
  Receipt,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Subscription = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const { data: plans } = usePlans();
  const { data: billingHistory = [], isLoading: billingLoading } = useBillingHistory();
  const payfast = usePayfastCheckout();
  const [searchParams] = useSearchParams();
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  // Check for payment callback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const plan = searchParams.get('plan');
    
    if (paymentStatus === 'success' && plan) {
      toast({
        title: "Payment Successful!",
        description: `You've been upgraded to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`,
      });
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. Your plan remains unchanged.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleUpgrade = async (planName: string) => {
    if (planName === 'free') {
      setIsUpgrading(planName);
      try {
        const updatedUser = await authService.updatePlan(planName);
        updateUser(updatedUser);
        toast({
          title: "Plan updated",
          description: "You are now on the Free plan.",
        });
      } catch (error) {
        toast({
          title: "Failed to update plan",
          variant: "destructive",
        });
      } finally {
        setIsUpgrading(null);
      }
    } else {
      setIsUpgrading(planName);
      payfast.mutate({ plan: planName as 'solo' | 'pro' | 'business' }, {
        onSettled: () => setIsUpgrading(null),
      });
    }
  };

  const subscriptionPlans = [
    {
      name: 'free',
      label: 'Free',
      price: 0,
      period: 'forever',
      description: 'For getting started',
      icon: null,
      features: [
        { text: '20 emails/month', icon: Mail },
        { text: '0 SMS/month', icon: MessageSquare },
        { text: '30 invoices/month', icon: FileText },
        { text: '3 templates', icon: Palette },
        { text: 'IEOSUIA branding', icon: null },
      ],
      highlight: false,
    },
    {
      name: 'solo',
      label: 'Solo',
      price: 149,
      period: '/month',
      description: 'For solo entrepreneurs',
      icon: Zap,
      features: [
        { text: '50 emails/month @ R0.10', icon: Mail },
        { text: '10 SMS/month @ R0.25', icon: MessageSquare },
        { text: 'Unlimited invoices', icon: FileText },
        { text: 'Custom templates', icon: Palette },
        { text: 'Remove branding', icon: null },
        { text: 'Email templates', icon: null },
      ],
      highlight: false,
    },
    {
      name: 'pro',
      label: 'Pro',
      price: 299,
      period: '/month',
      description: 'For growing businesses',
      icon: Star,
      features: [
        { text: '100 emails/month @ R0.10', icon: Mail },
        { text: '25 SMS/month @ R0.24', icon: MessageSquare },
        { text: 'Unlimited invoices', icon: FileText },
        { text: 'All templates', icon: Palette },
        { text: 'Auto reminders', icon: Bell },
        { text: 'Advanced reports', icon: BarChart3 },
        { text: 'Priority support', icon: Shield },
      ],
      highlight: true,
    },
    {
      name: 'business',
      label: 'Business',
      price: 599,
      period: '/month',
      description: 'For teams',
      icon: Crown,
      features: [
        { text: '200 emails/month @ R0.10', icon: Mail },
        { text: '50 SMS/month @ R0.23', icon: MessageSquare },
        { text: 'Unlimited invoices', icon: FileText },
        { text: 'Everything in Pro', icon: null },
        { text: 'Multi-user (up to 10)', icon: Users },
        { text: 'White-label', icon: Palette },
        { text: 'Dedicated manager', icon: Shield },
      ],
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader
          title="Subscription"
          subtitle="Manage your plan and billing"
        />

        <main className="p-6">
          {/* Payment Retry Warning - shown at top if there are failed payments */}
          <PaymentRetryStatus variant="full" />
          
          {/* Current Plan Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl font-bold text-foreground capitalize">
                        {credits?.plan || 'Free'}
                      </span>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        Active
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {credits?.plan === 'free' 
                        ? 'Upgrade for more features and credits'
                        : `R${credits?.monthly_price}/month • Renews in ${credits?.days_until_reset} days`
                      }
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">
                        {credits?.credits.email.remaining}/{credits?.credits.email.monthly_limit}
                      </p>
                      <p className="text-xs text-muted-foreground">Email Credits</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">
                        {credits?.credits.sms.remaining}/{credits?.credits.sms.monthly_limit}
                      </p>
                      <p className="text-xs text-muted-foreground">SMS Credits</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plans */}
          <h3 className="text-lg font-semibold text-foreground mb-4">Available Plans</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {subscriptionPlans.map((plan) => {
              const isCurrent = user?.plan === plan.name;
              const isUpgrade = subscriptionPlans.findIndex(p => p.name === plan.name) > 
                               subscriptionPlans.findIndex(p => p.name === user?.plan);
              
              return (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.highlight
                      ? 'border-2 border-accent shadow-glow'
                      : isCurrent
                      ? 'border-2 border-accent/50'
                      : ''
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      {plan.icon && (
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                          <plan.icon className="w-4 h-4 text-accent" />
                        </div>
                      )}
                      <CardTitle className="text-lg">{plan.label}</CardTitle>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        R{plan.price}
                      </span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          {feature.icon ? (
                            <feature.icon className="w-4 h-4 text-accent" />
                          ) : (
                            <Check className="w-4 h-4 text-accent" />
                          )}
                          <span className="text-foreground">{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        variant={plan.highlight ? 'accent' : isUpgrade ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => handleUpgrade(plan.name)}
                        disabled={isUpgrading === plan.name || payfast.isPending}
                      >
                        {isUpgrading === plan.name ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4 mr-2" />
                        )}
                        {isUpgrade ? 'Upgrade' : 'Downgrade'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Billing History
              </CardTitle>
              <CardDescription>Your recent transactions and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {billingLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : billingHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {user?.plan === 'free' 
                    ? 'No billing history. Upgrade to a paid plan to see transactions.'
                    : 'No billing history found.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {billingHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.plan} Plan</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleDateString('en-ZA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-foreground">R{item.amount}</span>
                        <Badge className={
                          item.status === 'completed' 
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-warning/10 text-warning border-warning/20'
                        }>
                          {item.status === 'completed' ? 'Paid' : item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Subscription;
