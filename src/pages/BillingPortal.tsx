import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useManualRetry } from "@/hooks/usePaymentRetry";
import api from "@/services/api";
import {
  CreditCard,
  Receipt,
  Calendar,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Shield,
  RefreshCw,
  FileText,
  Clock,
  Loader2,
  Edit,
  Star,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentMethod {
  id: number;
  type: 'card' | 'bank' | 'payfast' | 'paystack';
  last_four: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  created_at: string;
}

interface BillingTransaction {
  id: number;
  type: 'subscription' | 'invoice' | 'credit';
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_method?: string;
  invoice_url?: string;
  created_at: string;
  retry_count?: number;
  max_retries?: number;
  next_retry_at?: string;
  failure_reason?: string;
}

interface SubscriptionDetails {
  plan: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_end: string;
  cancel_at_period_end: boolean;
  next_billing_amount: number;
}

// Failed Payment Card Component with Retry Functionality
const FailedPaymentCard = ({ 
  transaction, 
  onDownload, 
  getStatusBadge 
}: { 
  transaction: BillingTransaction;
  onDownload: (id: number) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}) => {
  const manualRetry = useManualRetry();
  const hasRetries = transaction.retry_count !== undefined && transaction.max_retries !== undefined;
  const canRetry = transaction.status === 'failed' && 
    (transaction.retry_count ?? 0) < (transaction.max_retries ?? 3);

  return (
    <div
      className={`p-4 rounded-lg hover:bg-muted/50 transition-colors ${
        transaction.status === 'failed' 
          ? 'bg-destructive/5 border border-destructive/20' 
          : 'bg-muted/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            transaction.status === 'completed' ? 'bg-success/10' :
            transaction.status === 'failed' ? 'bg-destructive/10' :
            'bg-warning/10'
          }`}>
            {transaction.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : transaction.status === 'failed' ? (
              <AlertCircle className="w-5 h-5 text-destructive" />
            ) : (
              <Clock className="w-5 h-5 text-warning" />
            )}
          </div>
          <div>
            <p className="font-medium">{transaction.description}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(transaction.created_at).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {transaction.payment_method && ` • ${transaction.payment_method}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-semibold ${
            transaction.status === 'refunded' ? 'text-muted-foreground line-through' : ''
          }`}>
            R{transaction.amount.toFixed(2)}
          </span>
          {getStatusBadge(transaction.status)}
          {transaction.status === 'completed' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDownload(transaction.id)}
              title="Download Invoice"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => manualRetry.mutate(transaction.id)}
              disabled={manualRetry.isPending}
              className="gap-2"
            >
              {manualRetry.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Retry Now
            </Button>
          )}
        </div>
      </div>
      
      {/* Failed Payment Details */}
      {transaction.status === 'failed' && hasRetries && (
        <div className="mt-3 pt-3 border-t border-destructive/10">
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {transaction.failure_reason && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Reason:</span> {transaction.failure_reason}
                </p>
              )}
              <p className="text-muted-foreground">
                <span className="font-medium">Retry Attempts:</span>{' '}
                {transaction.retry_count} of {transaction.max_retries}
              </p>
              {transaction.next_retry_at && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Next Retry:</span>{' '}
                  {new Date(transaction.next_retry_at).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
              {!canRetry && (
                <p className="text-destructive font-medium">
                  Maximum retry attempts reached. Please update your payment method.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BillingPortal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Fetch billing data
  const { data: billingData, isLoading } = useQuery({
    queryKey: ['billing-portal'],
    queryFn: async () => {
      const response = await api.get('/billing/portal');
      return response.data;
    },
  });

  // Fetch transaction history
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['billing-transactions'],
    queryFn: async () => {
      const response = await api.get('/billing/transactions');
      return response.data.data || [];
    },
  });

  // Set default payment method
  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: number) => {
      const response = await api.post(`/billing/payment-methods/${paymentMethodId}/default`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-portal'] });
      toast({
        title: "Default payment updated",
        description: "Your default payment method has been changed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update default payment method",
        variant: "destructive",
      });
    },
  });

  // Remove payment method
  const removeMutation = useMutation({
    mutationFn: async (paymentMethodId: number) => {
      const response = await api.delete(`/billing/payment-methods/${paymentMethodId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-portal'] });
      toast({
        title: "Payment method removed",
        description: "The payment method has been removed from your account.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/payfast/cancel-subscription');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billing-portal'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setCancelDialogOpen(false);
      toast({
        title: "Subscription cancelled",
        description: data.message || "Your subscription has been cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  // Download invoice
  const downloadInvoice = async (transactionId: number) => {
    try {
      const response = await api.get(`/billing/transactions/${transactionId}/invoice`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const getCardBrandIcon = (brand?: string) => {
    // Could add brand-specific icons here
    return <CreditCard className="w-6 h-6" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-muted text-muted-foreground">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const subscription: SubscriptionDetails = billingData?.subscription || {
    plan: user?.plan || 'free',
    status: 'active',
    current_period_end: user?.subscription_renewal_date || new Date().toISOString(),
    cancel_at_period_end: false,
    next_billing_amount: 0,
  };

  const paymentMethods: PaymentMethod[] = billingData?.payment_methods || [];

  const planPrices: Record<string, number> = {
    solo: 149,
    pro: 299,
    business: 599,
    enterprise: 999,
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader
          title="Billing Portal"
          subtitle="Manage your payment methods and billing history"
        />

        <main className="p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
              <TabsTrigger value="history">Billing History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Current Subscription */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Current Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl font-bold text-foreground capitalize">
                            {subscription.plan}
                          </span>
                          <Badge className={
                            subscription.status === 'active' 
                              ? 'bg-success/10 text-success border-success/20'
                              : subscription.status === 'cancelled'
                              ? 'bg-warning/10 text-warning border-warning/20'
                              : 'bg-destructive/10 text-destructive border-destructive/20'
                          }>
                            {subscription.status === 'active' && subscription.cancel_at_period_end 
                              ? 'Cancels at period end' 
                              : subscription.status}
                          </Badge>
                        </div>
                        
                        {subscription.plan !== 'free' && (
                          <>
                            <p className="text-muted-foreground mb-4">
                              <span className="text-2xl font-semibold text-foreground">
                                R{planPrices[subscription.plan] || 0}
                              </span>
                              /month
                            </p>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {subscription.cancel_at_period_end 
                                    ? 'Access until: '
                                    : 'Next billing: '}
                                  <strong>
                                    {new Date(subscription.current_period_end).toLocaleDateString('en-ZA', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </strong>
                                </span>
                              </div>
                              {!subscription.cancel_at_period_end && (
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                                  <span>
                                    Next charge: <strong>R{planPrices[subscription.plan] || 0}</strong>
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <Button variant="outline" asChild>
                          <a href="/dashboard/subscription">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Change Plan
                          </a>
                        </Button>
                        
                        {subscription.plan !== 'free' && !subscription.cancel_at_period_end && (
                          <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" className="text-destructive hover:text-destructive">
                                Cancel Subscription
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  You will continue to have access to your {subscription.plan} plan until {new Date(subscription.current_period_end).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })}. After that, your account will be downgraded to the Free plan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelSubscriptionMutation.mutate()}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={cancelSubscriptionMutation.isPending}
                                >
                                  {cancelSubscriptionMutation.isPending && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  )}
                                  Yes, Cancel
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="text-2xl font-bold">
                          R{transactions
                            .filter((t: BillingTransaction) => t.status === 'completed')
                            .reduce((sum: number, t: BillingTransaction) => sum + t.amount, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Methods</p>
                        <p className="text-2xl font-bold">{paymentMethods.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Transactions</p>
                        <p className="text-2xl font-bold">{transactions.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <Skeleton className="h-10 w-48" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No transactions yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((transaction: BillingTransaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              {transaction.type === 'subscription' ? (
                                <Shield className="w-5 h-5 text-primary" />
                              ) : (
                                <Receipt className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString('en-ZA', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">R{transaction.amount.toFixed(2)}</span>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Methods Tab */}
            <TabsContent value="payment-methods" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Payment Methods
                      </CardTitle>
                      <CardDescription>
                        Manage your saved payment methods
                      </CardDescription>
                    </div>
                    <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Payment Method
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Payment Method</DialogTitle>
                          <DialogDescription>
                            Choose a payment provider to add a new payment method
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Button
                            variant="outline"
                            className="h-16 justify-start gap-4"
                            onClick={() => {
                              window.location.href = '/dashboard/subscription';
                            }}
                          >
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">PayFast</p>
                              <p className="text-sm text-muted-foreground">Credit/Debit card, EFT, Mobicred</p>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-16 justify-start gap-4"
                            onClick={() => {
                              window.location.href = '/dashboard/subscription';
                            }}
                          >
                            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-success" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Paystack</p>
                              <p className="text-sm text-muted-foreground">Card payments (Nigeria, Ghana, SA)</p>
                            </div>
                          </Button>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddPaymentOpen(false)}>
                            Cancel
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <Skeleton className="h-12 w-48" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      ))}
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-4">No payment methods saved</p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Add a payment method to enable automatic billing for your subscription
                      </p>
                      <Button onClick={() => setAddPaymentOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            method.is_default ? 'border-primary bg-primary/5' : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center border">
                              {getCardBrandIcon(method.brand)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {method.brand || method.type} •••• {method.last_four}
                                </p>
                                {method.is_default && (
                                  <Badge className="bg-primary/10 text-primary border-primary/20">
                                    <Star className="w-3 h-3 mr-1" />
                                    Default
                                  </Badge>
                                )}
                              </div>
                              {method.expiry_month && method.expiry_year && (
                                <p className="text-sm text-muted-foreground">
                                  Expires {method.expiry_month}/{method.expiry_year}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!method.is_default && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultMutation.mutate(method.id)}
                                disabled={setDefaultMutation.isPending}
                              >
                                Set Default
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  disabled={method.is_default && paymentMethods.length > 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Payment Method?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the card ending in {method.last_four} from your account.
                                    {method.is_default && (
                                      <span className="block mt-2 text-warning">
                                        This is your default payment method. Please set another method as default first.
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removeMutation.mutate(method.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={method.is_default}
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>
                    Complete history of all your billing transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <Skeleton className="h-10 w-48" />
                          <Skeleton className="h-6 w-32" />
                        </div>
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction: BillingTransaction) => (
                        <FailedPaymentCard
                          key={transaction.id}
                          transaction={transaction}
                          onDownload={downloadInvoice}
                          getStatusBadge={getStatusBadge}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default BillingPortal;
