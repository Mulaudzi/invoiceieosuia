import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Login successful!",
      description: "Redirecting to dashboard...",
    });

    // In production, this would redirect to dashboard
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg hero-gradient flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              IEOSUIA<span className="text-accent">.</span>
            </span>
          </Link>

          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground mb-8">
              Enter your credentials to access your account
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
                </div>
              </div>

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

              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
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
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 animate-float">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Manage your invoices with ease
          </h2>
          <p className="text-white/80 mb-8">
            Track payments, send reminders, and grow your business with powerful insights.
          </p>
<div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">10K+</p>
              <p className="text-white/70 text-sm">Happy Users</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">R900M+</p>
              <p className="text-white/70 text-sm">Invoices Sent</p>
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
