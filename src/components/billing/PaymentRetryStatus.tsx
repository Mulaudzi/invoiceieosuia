import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, AlertCircle, Clock, CreditCard, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useManualRetry } from "@/hooks/usePaymentRetry";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

interface PaymentRetryInfo {
  has_failed_payments: boolean;
  failed_count: number;
  grace_until: string | null;
  next_retry_at: string | null;
  latest_failure: {
    id: number;
    amount: number;
    plan: string;
    failure_reason: string | null;
    retry_count: number;
    max_retries: number;
  } | null;
}

interface PaymentRetryStatusProps {
  variant?: "compact" | "full";
  className?: string;
}

export const PaymentRetryStatus = ({ variant = "full", className = "" }: PaymentRetryStatusProps) => {
  const navigate = useNavigate();
  const manualRetry = useManualRetry();
  
  const { data: retryInfo, isLoading } = useQuery({
    queryKey: ['payment-retry-status'],
    queryFn: async (): Promise<PaymentRetryInfo> => {
      const response = await api.get('/billing/retry-status');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !retryInfo?.has_failed_payments) {
    return null;
  }

  const { grace_until, next_retry_at, latest_failure } = retryInfo;
  const isInGracePeriod = grace_until && new Date(grace_until) > new Date();
  const daysUntilGraceEnds = grace_until 
    ? Math.ceil((new Date(grace_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleRetryNow = () => {
    if (latest_failure?.id) {
      manualRetry.mutate(latest_failure.id);
    }
  };

  const handleUpdatePayment = () => {
    navigate('/dashboard/billing');
  };

  // Compact variant for sidebar or small spaces
  if (variant === "compact") {
    return (
      <div className={`p-3 bg-destructive/10 border border-destructive/20 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Payment Issue</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isInGracePeriod 
            ? `Grace period ends in ${daysUntilGraceEnds} days`
            : "Action required"
          }
        </p>
        <Button
          size="sm"
          variant="destructive"
          className="w-full mt-2"
          onClick={handleUpdatePayment}
        >
          <CreditCard className="w-3 h-3 mr-1" />
          Fix Payment
        </Button>
      </div>
    );
  }

  // Full variant with all details
  return (
    <Alert variant="destructive" className={`mb-6 ${className}`}>
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">
        {isInGracePeriod 
          ? "Your subscription is at risk" 
          : "Payment Failed"
        }
      </AlertTitle>
      <AlertDescription className="mt-3">
        <div className="space-y-3">
          {latest_failure && (
            <div className="bg-background/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {latest_failure.plan.charAt(0).toUpperCase() + latest_failure.plan.slice(1)} Plan Payment
                </span>
                <span className="font-semibold">R{latest_failure.amount.toFixed(2)}</span>
              </div>
              
              {latest_failure.failure_reason && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Reason:</span> {latest_failure.failure_reason}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Retry {latest_failure.retry_count} of {latest_failure.max_retries}
                </span>
                {next_retry_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Next retry: {new Date(next_retry_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {isInGracePeriod && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <p className="text-sm font-medium text-warning">
                ⚠️ Grace Period Active
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your subscription will be downgraded to Free on{" "}
                <strong>{new Date(grace_until!).toLocaleDateString()}</strong> ({daysUntilGraceEnds} days remaining)
                unless you update your payment method.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleUpdatePayment}
              className="gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Update Payment Method
            </Button>
            
            {latest_failure && latest_failure.retry_count < latest_failure.max_retries && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryNow}
                disabled={manualRetry.isPending}
                className="gap-2"
              >
                {manualRetry.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Retry Payment Now
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default PaymentRetryStatus;
