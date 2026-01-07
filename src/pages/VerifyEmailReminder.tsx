import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Mail, ArrowLeft, RefreshCw, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/api";

const VerifyEmailReminder = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authService.resendVerification();
      toast({
        title: "Email sent!",
        description: "We've sent a new verification email to your inbox.",
      });
    } catch (error) {
      toast({
        title: "Failed to send",
        description: error instanceof Error ? error.message : "Unable to send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-lg hero-gradient flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">
            IEOSUIA<span className="text-accent">.</span>
          </span>
        </Link>

        <div className="animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-accent" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Verify your email</h1>
          <p className="text-muted-foreground mb-6">
            We've sent a verification email to{" "}
            <span className="font-medium text-foreground">{user?.email}</span>. 
            Please click the link in the email to verify your account.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              <strong>Why verify?</strong> Email verification helps us keep your account secure 
              and ensures you can recover your password if needed.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              variant="accent" 
              className="w-full" 
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Wrong email?{" "}
            <button onClick={handleLogout} className="text-accent hover:underline">
              Sign out and try again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailReminder;
