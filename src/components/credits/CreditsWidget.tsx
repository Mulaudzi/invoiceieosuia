import { Mail, MessageSquare, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCredits } from "@/hooks/useCredits";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CreditsWidget() {
  const { data: credits, isLoading, error } = useCredits();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-soft p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !credits) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-soft p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Unable to load credits</span>
        </div>
      </div>
    );
  }

  const emailPercentage = credits.credits.email.monthly_limit > 0
    ? Math.round((credits.credits.email.remaining / credits.credits.email.monthly_limit) * 100)
    : 100;

  const smsPercentage = credits.credits.sms.monthly_limit > 0
    ? Math.round((credits.credits.sms.remaining / credits.credits.sms.monthly_limit) * 100)
    : 100;

  const getProgressColor = (percentage: number) => {
    if (percentage > 50) return "bg-success";
    if (percentage > 20) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-soft">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Monthly Credits</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium capitalize">
            {credits.plan} Plan
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Resets in {credits.days_until_reset} days
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Email Credits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-info" />
              </div>
              <span className="font-medium text-foreground">Email Credits</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {credits.credits.email.remaining}/{credits.credits.email.monthly_limit}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 ${getProgressColor(emailPercentage)} transition-all duration-500`}
              style={{ width: `${emailPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {credits.credits.email.used} used this month • R0.10 per email
          </p>
        </div>

        {/* SMS Credits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-accent" />
              </div>
              <span className="font-medium text-foreground">SMS Credits</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {credits.credits.sms.remaining}/{credits.credits.sms.monthly_limit}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 ${getProgressColor(smsPercentage)} transition-all duration-500`}
              style={{ width: `${smsPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {credits.credits.sms.used} used this month •{" "}
            {credits.plan === "solo" ? "R0.25" : credits.plan === "pro" ? "R0.24" : credits.plan === "business" ? "R0.23" : "R0.25"} per SMS
          </p>
        </div>

        {/* Low credits warning */}
        {(emailPercentage < 20 || smsPercentage < 20) && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Credits running low</p>
              <p className="text-xs text-muted-foreground">Upgrade your plan for more credits</p>
            </div>
          </div>
        )}

        {/* Upgrade button for free plan */}
        {credits.plan === "free" && (
          <Link to="/settings">
            <Button variant="accent" size="sm" className="w-full">
              Upgrade for More Credits
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
