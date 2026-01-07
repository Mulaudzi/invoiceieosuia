import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

type VerificationStatus = 'loading' | 'success' | 'error' | 'no-token';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    const verifyEmail = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        toast({
          title: 'Email verified!',
          description: 'Your email has been verified successfully.',
        });
      } catch (error) {
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Verification failed. The link may be expired or invalid.'
        );
      }
    };

    verifyEmail();
  }, [token, toast]);

  const handleResendVerification = async () => {
    try {
      await authService.resendVerification();
      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox for a new verification link.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resend verification email.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-accent-foreground" />
            </div>
          </div>

          {/* Loading State */}
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-accent mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Verifying your email...</h1>
              <p className="text-muted-foreground">Please wait while we verify your email address.</p>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h1>
              <p className="text-muted-foreground mb-6">
                Your email has been successfully verified. You can now access all features of your account.
              </p>
              <div className="space-y-3">
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                  Sign In
                </Button>
              </div>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-6">{errorMessage}</p>
              <div className="space-y-3">
                <Button onClick={handleResendVerification} className="w-full">
                  Resend Verification Email
                </Button>
                <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                  Back to Login
                </Button>
              </div>
            </>
          )}

          {/* No Token State */}
          {status === 'no-token' && (
            <>
              <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
              <p className="text-muted-foreground mb-6">
                This verification link appears to be invalid. Please check your email for the correct link or request a
                new one.
              </p>
              <div className="space-y-3">
                <Button onClick={handleResendVerification} className="w-full">
                  Resend Verification Email
                </Button>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Footer */}
          <p className="text-sm text-muted-foreground mt-8">
            Need help?{' '}
            <Link to="/#contact" className="text-accent hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
