import { useSearchParams, Link } from "react-router-dom";
import { XCircle, ArrowRight, RefreshCw, Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  
  const reason = searchParams.get('reason') || 'cancelled';
  const invoiceId = searchParams.get('invoice_id');
  const plan = searchParams.get('plan');

  const getMessage = () => {
    switch (reason) {
      case 'cancelled':
        return 'Your payment was cancelled. No charges were made to your account.';
      case 'failed':
        return 'Your payment could not be processed. Please try again or use a different payment method.';
      case 'declined':
        return 'Your payment was declined by your bank. Please contact your bank or try a different card.';
      case 'expired':
        return 'Your payment session has expired. Please try again.';
      default:
        return 'Something went wrong with your payment. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Payment {reason === 'cancelled' ? 'Cancelled' : 'Failed'}</CardTitle>
          <CardDescription>{getMessage()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <h4 className="font-medium mb-2">What you can do:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Try the payment again with the same or different payment method
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Check that your card details are correct and has sufficient funds
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Contact your bank if payments continue to be declined
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Reach out to our support team for assistance
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {invoiceId ? (
              <Button asChild className="flex-1">
                <Link to={`/dashboard/invoices`}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Link>
              </Button>
            ) : plan ? (
              <Button asChild className="flex-1">
                <Link to="/dashboard/subscription">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Link>
              </Button>
            ) : (
              <Button asChild className="flex-1">
                <Link to="/dashboard/payments">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild className="flex-1">
              <Link to="/support">
                <HelpCircle className="w-4 h-4 mr-2" />
                Get Help
              </Link>
            </Button>
          </div>

          <Button variant="ghost" asChild className="w-full">
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailed;
