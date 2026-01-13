import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import api from "@/services/api";

const ADMIN_TOKEN_KEY = 'ieosuia_admin_token';

export const getAdminToken = (): string | null => localStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (token: string): void => localStorage.setItem(ADMIN_TOKEN_KEY, token);
export const removeAdminToken = (): void => localStorage.removeItem(ADMIN_TOKEN_KEY);

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { executeRecaptcha, isLoaded: recaptchaLoaded } = useRecaptcha();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password1: "",
    password2: "",
    password3: "",
  });

  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    max: number;
    locked: boolean;
    retry_after_minutes?: number;
  } | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check if locked out before attempting
    if (rateLimitInfo?.locked) {
      toast({
        title: "Account Locked",
        description: `Too many failed attempts. Try again in ${rateLimitInfo.retry_after_minutes || 15} minutes.`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Execute reCAPTCHA
    let recaptchaToken: string | null = null;
    if (recaptchaLoaded) {
      recaptchaToken = await executeRecaptcha('admin_login');
      if (!recaptchaToken) {
        toast({
          title: "Security check failed",
          description: "Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await api.post('/admin/login/batch', {
        email: formData.email,
        password_1: formData.password1,
        password_2: formData.password2,
        password_3: formData.password3,
        recaptcha_token: recaptchaToken,
      });
      
      const data = response.data;
      
      if (data.success && data.admin_token) {
        setAdminToken(data.admin_token);
        setRateLimitInfo(null);
        toast({
          title: "Welcome, Admin",
          description: "Authentication complete. Redirecting to dashboard...",
        });
        
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 500);
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      
      // Update rate limit info from response
      if (errorData?.rate_limit) {
        setRateLimitInfo(errorData.rate_limit);
        
        if (errorData.rate_limit.locked) {
          toast({
            title: "Account Locked",
            description: `Too many failed attempts. Try again in ${errorData.rate_limit.retry_after_minutes || 15} minutes.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Authentication Failed",
            description: `Invalid credentials. ${errorData.rate_limit.remaining} attempts remaining.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Authentication Failed",
          description: errorData?.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
      // Clear passwords on failure
      setFormData({ ...formData, password1: "", password2: "", password3: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const allPasswordsFilled = formData.email && formData.password1 && formData.password2 && formData.password3;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Admin Access
            </h1>
            <p className="text-muted-foreground text-sm">
              Multi-password authentication required
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-2xl p-8">
            {/* Rate Limit Warning */}
            {rateLimitInfo && (
              <div className={`flex items-center gap-2 p-3 rounded-md text-sm mb-6 ${
                rateLimitInfo.locked 
                  ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                  : rateLimitInfo.remaining <= 2
                    ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                    : 'bg-muted text-muted-foreground'
              }`}>
                <Shield className="w-4 h-4 flex-shrink-0" />
                {rateLimitInfo.locked ? (
                  <span>Account locked. Try again in {rateLimitInfo.retry_after_minutes || 15} minutes.</span>
                ) : (
                  <span>{rateLimitInfo.remaining} of {rateLimitInfo.max} attempts remaining</span>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                    required
                    disabled={rateLimitInfo?.locked}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-accent/5 rounded-lg border border-accent/20">
                <p className="text-xs text-accent flex items-center gap-1 mb-2">
                  <Lock className="w-3 h-3" />
                  Enter all three passwords
                </p>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password 1
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password1}
                      onChange={(e) => setFormData({ ...formData, password1: e.target.value })}
                      placeholder="Enter first password"
                      required
                      disabled={rateLimitInfo?.locked}
                      className="pl-10"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password 2
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password2}
                      onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                      placeholder="Enter second password"
                      required
                      disabled={rateLimitInfo?.locked}
                      className="pl-10"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password 3
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password3}
                      onChange={(e) => setFormData({ ...formData, password3: e.target.value })}
                      placeholder="Enter third password"
                      required
                      disabled={rateLimitInfo?.locked}
                      className="pl-10 pr-10"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="accent" 
                className="w-full" 
                disabled={isLoading || !allPasswordsFilled || rateLimitInfo?.locked}
              >
                {isLoading ? (
                  "Authenticating..."
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Sign In
                  </>
                )}
              </Button>

              {/* reCAPTCHA notice */}
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Protected by reCAPTCHA
              </p>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-6">
              This area is restricted to authorized administrators only.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminLogin;