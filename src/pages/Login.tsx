import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import api, { authService } from "@/services/api";
import { setAdminToken } from "@/pages/admin/AdminLogin";
import ieosuiaLogo from "@/assets/ieosuia-invoices-logo.png";
import ieosuiaLogoWhite from "@/assets/ieosuia-invoices-logo-white.png";

const Login = () => {
  const { toast } = useToast();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { executeRecaptcha, isLoaded: recaptchaLoaded } = useRecaptcha();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  // Admin login state
  const [isAdminEmail, setIsAdminEmail] = useState(false);
  const [adminPasswords, setAdminPasswords] = useState({
    password_1: "",
    password_2: "",
    password_3: "",
  });
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    max: number;
    locked: boolean;
    retry_after_minutes?: number;
  } | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Handle Google OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleGoogleCallback(code);
    }
  }, [searchParams]);

  // Check if email is admin when email changes
  const checkAdminEmail = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setIsAdminEmail(false);
      setRateLimitInfo(null);
      return;
    }
    
    setCheckingAdmin(true);
    try {
      const response = await api.post('/admin/check-email', { email });
      setIsAdminEmail(response.data.is_admin === true);
      if (response.data.rate_limit) {
        setRateLimitInfo(response.data.rate_limit);
      }
    } catch {
      setIsAdminEmail(false);
      setRateLimitInfo(null);
    } finally {
      setCheckingAdmin(false);
    }
  }, []);

  // Debounce admin email check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAdminEmail(formData.email);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.email, checkAdminEmail]);

  // Reset admin passwords when switching away from admin
  useEffect(() => {
    if (!isAdminEmail) {
      setAdminPasswords({ password_1: "", password_2: "", password_3: "" });
    }
  }, [isAdminEmail]);

  const handleGoogleCallback = async (code: string) => {
    setIsGoogleLoading(true);
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
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const url = await authService.getGoogleAuthUrl();
      window.location.href = url;
    } catch {
      toast({
        title: "Google login failed",
        description: "Unable to connect to Google. Please try again.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Determine if this is an admin login based on filled passwords (more reliable than state)
    const isAdminLogin = Boolean(adminPasswords.password_1 && adminPasswords.password_2 && adminPasswords.password_3);

    // Execute reCAPTCHA with appropriate action
    let recaptchaToken: string | null = null;
    if (recaptchaLoaded) {
      const recaptchaAction = isAdminLogin ? 'admin_login' : 'login';
      console.log('reCAPTCHA action:', recaptchaAction, 'isAdminLogin:', isAdminLogin);
      recaptchaToken = await executeRecaptcha(recaptchaAction);
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

    // Admin batch login - all 3 passwords at once
    if (isAdminEmail) {
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

      try {
        const response = await api.post('/admin/login/batch', {
          email: formData.email,
          password_1: adminPasswords.password_1,
          password_2: adminPasswords.password_2,
          password_3: adminPasswords.password_3,
          recaptcha_token: recaptchaToken,
        });
        
        const data = response.data;
        
        if (data.success && data.admin_token) {
          setAdminToken(data.admin_token);
          setRateLimitInfo(null);
          toast({
            title: "Admin login successful!",
            description: "Redirecting to admin dashboard...",
          });
          navigate("/admin");
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
              title: "Authentication failed",
              description: `Invalid credentials. ${errorData.rate_limit.remaining} attempts remaining.`,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Authentication failed",
            description: "Invalid credentials. Please try again.",
            variant: "destructive",
          });
        }
        // Clear passwords on failure
        setAdminPasswords({ password_1: "", password_2: "", password_3: "" });
      }
      setIsLoading(false);
      return;
    }

    // Regular user login
    const result = await login(formData.email, formData.password, recaptchaToken || undefined);

    if (result.success) {
      toast({
        title: "Login successful!",
        description: "Redirecting to dashboard...",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: result.error,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const allAdminPasswordsFilled = adminPasswords.password_1 && adminPasswords.password_2 && adminPasswords.password_3;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8">
            <img 
              src={ieosuiaLogo} 
              alt="IEOSUIA Invoices Logo" 
              className="h-12 w-auto"
            />
          </Link>

          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground mb-8">
              {isAdminEmail 
                ? "Administrator authentication required" 
                : "Enter your credentials to access your account"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-10"
                  />
                  {checkingAdmin && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {isAdminEmail && (
                  <p className="text-xs text-accent mt-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin account detected - 3 passwords required
                  </p>
                )}
              </div>

              {/* Regular user password */}
              {!isAdminEmail && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-foreground">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Admin 3-password fields */}
              {isAdminEmail && (
                <div className="space-y-4 p-4 bg-accent/5 rounded-lg border border-accent/20">
                  {/* Rate Limit Warning */}
                  {rateLimitInfo && (
                    <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
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
                  
                  <div>
                    <label htmlFor="password_1" className="block text-sm font-medium text-foreground mb-2">
                      Password 1
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                      <Input
                        id="password_1"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter first password"
                        value={adminPasswords.password_1}
                        onChange={(e) => setAdminPasswords({ ...adminPasswords, password_1: e.target.value })}
                        required
                        disabled={rateLimitInfo?.locked}
                        className="pl-10"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password_2" className="block text-sm font-medium text-foreground mb-2">
                      Password 2
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                      <Input
                        id="password_2"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter second password"
                        value={adminPasswords.password_2}
                        onChange={(e) => setAdminPasswords({ ...adminPasswords, password_2: e.target.value })}
                        required
                        disabled={rateLimitInfo?.locked}
                        className="pl-10"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password_3" className="block text-sm font-medium text-foreground mb-2">
                      Password 3
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                      <Input
                        id="password_3"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter third password"
                        value={adminPasswords.password_3}
                        onChange={(e) => setAdminPasswords({ ...adminPasswords, password_3: e.target.value })}
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
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                variant="accent" 
                size="lg" 
                className="w-full" 
                disabled={isLoading || (isAdminEmail && !allAdminPasswordsFilled)}
              >
                {isLoading ? (
                  "Authenticating..."
                ) : isAdminEmail ? (
                  <>
                    <Shield className="w-4 h-4" />
                    Admin Sign In
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              {/* reCAPTCHA notice */}
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Protected by reCAPTCHA
              </p>

              {/* Divider - hide for admin */}
              {!isAdminEmail && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-background px-4 text-muted-foreground">or continue with</span>
                    </div>
                  </div>

                  {/* Google Sign In */}
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      "Connecting..."
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </Button>
                </>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-accent font-medium hover:underline">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <img 
            src={ieosuiaLogoWhite} 
            alt="IEOSUIA Logo" 
            className="h-16 mx-auto mb-8 animate-float"
          />
          <h2 className="text-3xl font-bold text-white mb-4">
            Manage your invoices with ease
          </h2>
          <p className="text-white/80 mb-8">
            Track payments, send reminders, and grow your business with powerful insights.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">ZAR</p>
              <p className="text-white/70 text-sm">& Multi-Currency</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">POPIA</p>
              <p className="text-white/70 text-sm">Compliant</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">99.9%</p>
              <p className="text-white/70 text-sm">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;