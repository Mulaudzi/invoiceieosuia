import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing (React StrictMode)
    if (processedRef.current) return;
    
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      const errorDescription = searchParams.get('error_description') || 'Authentication was cancelled';
      setError(errorDescription);
      toast({
        title: "Authentication cancelled",
        description: errorDescription,
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    
    if (code) {
      processedRef.current = true;
      handleGoogleCallback(code);
    } else {
      setError("No authorization code received");
      toast({
        title: "Authentication failed",
        description: "No authorization code received from Google",
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [searchParams]);

  const handleGoogleCallback = async (code: string) => {
    try {
      console.log("Processing Google OAuth callback...");
      
      // Call the backend to exchange code for token
      const { user, token } = await authService.googleCallback(code);
      
      console.log("Google OAuth successful, user:", user?.email);
      
      // Store user in localStorage for persistence
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      // Update auth context directly to avoid race conditions
      refreshUser();
      
      toast({
        title: "Login successful!",
        description: `Welcome${user?.name ? `, ${user.name}` : ''}!`,
      });
      
      // Use React Router navigation instead of full page reload
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      
      const message = error instanceof Error ? error.message : "Authentication failed. Please try again.";
      setError(message);
      
      toast({
        title: "Google login failed",
        description: message,
        variant: "destructive",
      });
      
      // Delay redirect so user can see the error
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-medium">Authentication Failed</div>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Completing Google sign-in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
