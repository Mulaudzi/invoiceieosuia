import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code) {
      handleGoogleCallback(code);
    } else {
      toast({
        title: "Authentication failed",
        description: "No authorization code received from Google",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [searchParams]);

  const handleGoogleCallback = async (code: string) => {
    try {
      await authService.googleCallback(code);
      toast({
        title: "Login successful!",
        description: "Welcome back!",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Google login failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      navigate("/login");
    }
  };

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
