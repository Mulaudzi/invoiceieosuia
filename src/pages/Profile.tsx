import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/api";
import { User, Building2, Phone, MapPin, FileText, Loader2, Mail, CheckCircle, AlertCircle } from "@/lib/icons";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AvatarUpload from "@/components/profile/AvatarUpload";
import PasswordChange from "@/components/profile/PasswordChange";
import { LogoUpload } from "@/components/profile/LogoUpload";

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
    registrationNumber: "", website: "", bankName: "", accountName: "", accountNumber: "", branchCode: "", swiftCode: "", paymentInstructions: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        businessName: user.businessName || "",
        phone: user.phone || "",
        address: user.address || "",
        taxNumber: user.taxNumber || "",
        registrationNumber: user.registrationNumber || "", website: user.website || "", bankName: user.bankName || "",
        accountName: user.accountName || "", accountNumber: user.accountNumber || "", branchCode: user.branchCode || "",
        swiftCode: user.swiftCode || "", paymentInstructions: user.paymentInstructions || "",
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
        registration_number: formData.registrationNumber, website: formData.website, bank_name: formData.bankName,
        account_name: formData.accountName, account_number: formData.accountNumber, branch_code: formData.branchCode,
        swift_code: formData.swiftCode, payment_instructions: formData.paymentInstructions,
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Profile" subtitle="Manage your personal and business information" />

        <main className="p-6 max-w-4xl">
          {/* Profile Header with Avatar */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <AvatarUpload user={user} onUpdate={updateUser} />
              <div className="flex-1 min-w-0 w-full">
                <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 min-w-0">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground break-all min-w-0">{user?.email}</span>
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
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                  <Badge variant="outline" className="capitalize">
                    Free
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
          <div className="mb-6"><LogoUpload /></div>
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
              <div><Label htmlFor="registrationNumber">Registration Number</Label><Input id="registrationNumber" value={formData.registrationNumber} onChange={(e)=>setFormData({...formData,registrationNumber:e.target.value})} placeholder="Company registration number" /></div>
              <div><Label htmlFor="website">Website</Label><Input id="website" value={formData.website} onChange={(e)=>setFormData({...formData,website:e.target.value})} placeholder="https://example.co.za" /></div>
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
            <Button variant="accent" className="mt-4" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Profile
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-soft mb-6">
            <h3 className="font-semibold text-foreground mb-1">Default Payment Details</h3>
            <p className="text-sm text-muted-foreground mb-4">New invoices inherit these details. You can override them while creating or editing any invoice.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label htmlFor="bankName">Bank Name</Label><Input id="bankName" value={formData.bankName} onChange={(e)=>setFormData({...formData,bankName:e.target.value})} /></div>
              <div><Label htmlFor="accountName">Account Name</Label><Input id="accountName" value={formData.accountName} onChange={(e)=>setFormData({...formData,accountName:e.target.value})} /></div>
              <div><Label htmlFor="accountNumber">Account Number</Label><Input id="accountNumber" value={formData.accountNumber} onChange={(e)=>setFormData({...formData,accountNumber:e.target.value})} /></div>
              <div><Label htmlFor="branchCode">Branch Code</Label><Input id="branchCode" value={formData.branchCode} onChange={(e)=>setFormData({...formData,branchCode:e.target.value})} /></div>
              <div><Label htmlFor="swiftCode">SWIFT / BIC</Label><Input id="swiftCode" value={formData.swiftCode} onChange={(e)=>setFormData({...formData,swiftCode:e.target.value})} /></div>
              <div className="md:col-span-2"><Label htmlFor="paymentInstructions">Payment Instructions</Label><Textarea id="paymentInstructions" value={formData.paymentInstructions} onChange={(e)=>setFormData({...formData,paymentInstructions:e.target.value})} placeholder="Please use the invoice number as the payment reference." /></div>
            </div>
            <Button variant="accent" className="mt-4" onClick={handleSave} disabled={isSaving}>{isSaving&&<Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Save Payment Details</Button>
          </div>

          {/* Password Change */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
            <PasswordChange />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
