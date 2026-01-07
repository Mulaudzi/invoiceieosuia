import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/api";
import { User, Building2, Mail, CreditCard, LogOut, Loader2, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PlanType } from "@/lib/types";

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    businessName: user?.businessName || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        businessName: user.businessName || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await authService.updateProfile({
        name: formData.name,
        businessName: formData.businessName,
      });
      updateUser(updatedUser);
      toast({ title: "Settings saved successfully" });
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = async (plan: PlanType) => {
    setIsUpgrading(plan);
    try {
      const updatedUser = await authService.updatePlan(plan);
      updateUser(updatedUser);
      toast({
        title: "Plan updated!",
        description: `You are now on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`,
      });
    } catch (error) {
      toast({
        title: "Failed to update plan",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      navigate("/");
    }
  };

  const plans = [
    {
      value: "free",
      label: "Free",
      price: "R0",
      features: ["30 invoices/month", "3 templates", "IEOSUIA branding"],
    },
    {
      value: "pro",
      label: "Pro",
      price: "R349",
      features: ["Unlimited invoices", "Custom templates", "SMS reminders", "Remove branding"],
    },
    {
      value: "business",
      label: "Business",
      price: "R899",
      features: ["Everything in Pro", "Multi-user access", "Advanced reports", "API access", "Priority support"],
    },
  ];

  const currentPlanIndex = plans.findIndex((p) => p.value === user?.plan);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Settings" subtitle="Manage your account and preferences" />

        <main className="p-6 max-w-4xl">
          {/* Profile Section */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft mb-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Settings
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Your company name"
                />
              </div>
            </div>
            <Button variant="accent" className="mt-4" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>

          {/* Plan Section */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft mb-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription Plan
            </h3>
            <p className="text-muted-foreground mb-4">
              Current plan:{" "}
              <span className="font-medium text-accent capitalize">{user?.plan}</span>
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan, index) => {
                const isCurrentPlan = user?.plan === plan.value;
                const isUpgrade = index > currentPlanIndex;
                const isDowngrade = index < currentPlanIndex;

                return (
                  <div
                    key={plan.value}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCurrentPlan
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{plan.label}</h4>
                      {isCurrentPlan && (
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-2">
                      {plan.price}
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-success" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrentPlan && (
                      <Button
                        variant={isUpgrade ? "accent" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpgrade(plan.value as PlanType)}
                        disabled={isUpgrading === plan.value}
                      >
                        {isUpgrading === plan.value && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {isUpgrade ? "Upgrade" : "Downgrade"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-card rounded-xl border border-destructive/30 p-6 shadow-soft">
            <h3 className="font-semibold text-destructive mb-4 flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Account Actions
            </h3>
            <p className="text-muted-foreground mb-4">
              Sign out of your account or manage your session.
            </p>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
