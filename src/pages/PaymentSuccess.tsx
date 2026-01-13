import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Receipt, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/services/api";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<{
    amount?: number;
    reference?: string;
    invoice_number?: string;
    plan?: string;
  } | null>(null);

  const reference = searchParams.get('reference');
  const plan = searchParams.get('plan');
  const invoiceId = searchParams.get('invoice_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (reference) {
        try {
          const response = await api.get(`/paystack/verify/${reference}`);
          if (response.data.success) {
            setPaymentDetails({
              amount: response.data.amount,
              reference: response.data.reference,
              invoice_number: response.data.invoice_number,
            });
          }
        } catch (error) {
          console.error('Payment verification failed:', error);
        }
      } else if (plan) {
        setPaymentDetails({ plan });
      }
      setVerifying(false);
    };

    verifyPayment();
  }, [reference, plan]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            {plan 
              ? `You've been upgraded to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`
              : 'Your payment has been processed successfully.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentDetails && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left">
              {paymentDetails.amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">R{paymentDetails.amount.toFixed(2)}</span>
                </div>
              )}
              {paymentDetails.reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-sm">{paymentDetails.reference}</span>
                </div>
              )}
              {paymentDetails.invoice_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-semibold">{paymentDetails.invoice_number}</span>
                </div>
              )}
              {paymentDetails.plan && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-semibold capitalize">{paymentDetails.plan}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to your registered email address.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {invoiceId ? (
              <Button asChild className="flex-1">
                <Link to={`/dashboard/invoices`}>
                  <Receipt className="w-4 h-4 mr-2" />
                  View Invoices
                </Link>
              </Button>
            ) : (
              <Button asChild className="flex-1">
                <Link to="/dashboard/subscription">
                  <Receipt className="w-4 h-4 mr-2" />
                  View Subscription
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild className="flex-1">
              <Link to="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
