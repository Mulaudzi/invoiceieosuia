import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User, Building2, Mail, CreditCard, LogOut } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlanType } from "@/lib/types";

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    businessName: user?.businessName || "",
  });

  const handleSave = () => {
    updateUser({
      name: formData.name,
      businessName: formData.businessName,
    });
    toast({ title: "Settings saved successfully" });
  };

  const handleUpgrade = (plan: PlanType) => {
    updateUser({ plan });
    toast({
      title: "Plan updated!",
      description: `You are now on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`,
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const plans = [
    { value: "free", label: "Free", price: "R0", features: ["30 invoices/month", "3 templates", "IEOSUIA branding"] },
    { value: "pro", label: "Pro", price: "R349", features: ["Unlimited invoices", "Custom templates", "Automated reminders", "Remove branding"] },
    { value: "business", label: "Business", price: "R899", features: ["Everything in Pro", "Multi-user access", "Advanced reports", "API access"] },
  ];

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
            <Button variant="accent" className="mt-4" onClick={handleSave}>
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
              Current plan: <span className="font-medium text-accent capitalize">{user?.plan}</span>
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.value}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    user?.plan === plan.value
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <h4 className="font-semibold text-foreground">{plan.label}</h4>
                  <p className="text-2xl font-bold text-foreground mb-2">{plan.price}<span className="text-sm text-muted-foreground">/mo</span></p>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    {plan.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                  {user?.plan !== plan.value && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleUpgrade(plan.value as PlanType)}
                    >
                      {plans.findIndex(p => p.value === user?.plan) < plans.findIndex(p => p.value === plan.value)
                        ? "Upgrade"
                        : "Downgrade"}
                    </Button>
                  )}
                </div>
              ))}
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
