import { useCredits, CreditUsage } from "@/hooks/useCredits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, FileText, Zap, Crown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditsDisplayProps {
  showUpgrade?: boolean;
  compact?: boolean;
}

export function CreditsDisplay({ showUpgrade = true, compact = false }: CreditsDisplayProps) {
  const { data: usage, isLoading } = useCredits();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!usage) return null;

  const emailPercentage = usage.credits.email.monthly_limit > 0 
    ? (usage.credits.email.used / usage.credits.email.monthly_limit) * 100 
    : 0;
  const smsPercentage = usage.credits.sms.monthly_limit > 0 
    ? (usage.credits.sms.used / usage.credits.sms.monthly_limit) * 100 
    : 0;

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      free: { color: "bg-muted text-muted-foreground", icon: null },
      solo: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: null },
      pro: { color: "bg-accent/10 text-accent border-accent/20", icon: <Zap className="w-3 h-3" /> },
      business: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: <Crown className="w-3 h-3" /> },
      enterprise: { color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: <Crown className="w-3 h-3" /> },
    };
    const variant = variants[plan] || variants.free;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        {variant.icon}
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">{usage.credits.email.remaining}</span>
            <span className="text-muted-foreground">/{usage.credits.email.monthly_limit}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">{usage.credits.sms.remaining}</span>
            <span className="text-muted-foreground">/{usage.credits.sms.monthly_limit}</span>
          </span>
        </div>
        {getPlanBadge(usage.plan)}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Usage & Credits</CardTitle>
            <CardDescription>Your monthly notification limits</CardDescription>
          </div>
          {getPlanBadge(usage.plan)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Credits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" />
              <span className="font-medium">Email Notifications</span>
            </div>
            <span className="text-muted-foreground">
              {usage.credits.email.used} / {usage.credits.email.monthly_limit} used
            </span>
          </div>
          <Progress value={emailPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {usage.credits.email.remaining} emails remaining this month
          </p>
        </div>

        {/* SMS Credits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span className="font-medium">SMS Notifications</span>
            </div>
            <span className="text-muted-foreground">
              {usage.credits.sms.used} / {usage.credits.sms.monthly_limit} used
            </span>
          </div>
          <Progress value={smsPercentage} className="h-2" />
          {usage.credits.sms.monthly_limit === 0 ? (
            <p className="text-xs text-warning">
              SMS not available on Free plan. Upgrade to send SMS reminders.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {usage.credits.sms.remaining} SMS remaining this month
            </p>
          )}
        </div>

        {/* Invoice Limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span className="font-medium">Invoices</span>
            </div>
            <span className="text-muted-foreground">
              {usage.credits.invoices.unlimited 
                ? "Unlimited" 
                : `${usage.credits.invoices.used} / ${usage.credits.invoices.limit}`}
            </span>
          </div>
          {!usage.credits.invoices.unlimited && (
            <Progress 
              value={(usage.credits.invoices.used / (usage.credits.invoices.limit || 1)) * 100} 
              className="h-2" 
            />
          )}
        </div>

        {/* Reset Info */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Credits reset in {usage.days_until_reset} days ({usage.reset_date})
          </p>
        </div>

        {/* Upgrade CTA */}
        {showUpgrade && usage.plan !== 'business' && usage.plan !== 'enterprise' && (
          <Link to="/dashboard/settings">
            <Button variant="outline" className="w-full group">
              <Zap className="w-4 h-4 mr-2 text-accent" />
              Upgrade for more credits
              <ArrowUpRight className="w-4 h-4 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}