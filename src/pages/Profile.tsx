import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/api";
import { User, Building2, Phone, MapPin, FileText, Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    phone: "",
    address: "",
    taxNumber: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        businessName: user.businessName || "",
        phone: user.phone || "",
        address: user.address || "",
        taxNumber: user.taxNumber || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await authService.updateProfile({
        name: formData.name,
        business_name: formData.businessName,
        phone: formData.phone,
        address: formData.address,
        tax_number: formData.taxNumber,
      } as any);
      updateUser(updatedUser);
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Profile" subtitle="Manage your personal and business information" />

        <main className="p-6 max-w-4xl">
          {/* Profile Header */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {getInitials(user?.name || "U")}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user?.email}</span>
                  {user?.emailVerifiedAt ? (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {user?.plan} Plan
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft mb-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+27 12 345 6789"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft mb-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Business Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Your company name"
                />
              </div>
              <div>
                <Label htmlFor="taxNumber">Tax Number / VAT</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="taxNumber"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="VAT number"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Business Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Your business address"
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button variant="accent" onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Profile
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
