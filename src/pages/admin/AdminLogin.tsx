import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
  const [step, setStep] = useState(1);
  const [sessionToken, setSessionToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    password1: "",
    password2: "",
    password3: "",
  });

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/admin/login/step1', {
        username: formData.username,
        password: formData.password1,
      });

      setSessionToken(response.data.session_token);
      setStep(2);
      toast({
        title: "Step 1 Complete",
        description: "Enter the second password to continue.",
      });
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/admin/login/step2', {
        session_token: sessionToken,
        password: formData.password2,
      });

      setSessionToken(response.data.session_token);
      setStep(3);
      toast({
        title: "Step 2 Complete",
        description: "Enter the final password to gain access.",
      });
    } catch (error: any) {
      setStep(1);
      setSessionToken("");
      toast({
        title: "Authentication Failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/admin/login/step3', {
        session_token: sessionToken,
        password: formData.password3,
      });

      setAdminToken(response.data.admin_token);
      toast({
        title: "Welcome, Admin",
        description: "Authentication complete. Redirecting to dashboard...",
      });
      
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
    } catch (error: any) {
      setStep(1);
      setSessionToken("");
      setFormData({ ...formData, password1: "", password2: "", password3: "" });
      toast({
        title: "Authentication Failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = [
    "Enter your administrator identity",
    "Verify with second key",
    "Final authentication"
  ];

  const stepDescriptions = [
    "Enter your admin username and first password",
    "Enter the second authentication password",
    "Enter the final password to complete authentication"
  ];

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
              Multi-step authentication required
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step 
                    ? 'bg-accent text-accent-foreground' 
                    : s === step 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`w-8 h-1 mx-1 rounded ${
                    s < step ? 'bg-accent' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Step {step}: {stepLabels[step - 1]}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {stepDescriptions[step - 1]}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Admin Identity
                  </label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter your admin username"
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    First Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password1}
                      onChange={(e) => setFormData({ ...formData, password1: e.target.value })}
                      placeholder="Enter first password"
                      required
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
                <Button type="submit" variant="accent" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : (
                    <>
                      Continue to Step 2
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Second Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password2}
                      onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                      placeholder="Enter second password"
                      required
                      autoComplete="off"
                      autoFocus
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
                <Button type="submit" variant="accent" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : (
                    <>
                      Continue to Step 3
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Final Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password3}
                      onChange={(e) => setFormData({ ...formData, password3: e.target.value })}
                      placeholder="Enter final password"
                      required
                      autoComplete="off"
                      autoFocus
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
                <Button type="submit" variant="accent" className="w-full" disabled={isLoading}>
                  {isLoading ? "Authenticating..." : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Complete Authentication
                    </>
                  )}
                </Button>
              </form>
            )}

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