import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Eye, EyeOff, AlertTriangle } from "lucide-react";
import api from "@/services/api";

const AdminSetup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password_1: false,
    password_2: false,
    password_3: false,
    setup_key: false,
  });
  
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password_1: "",
    password_2: "",
    password_3: "",
    setup_key: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.name || !formData.password_1 || !formData.password_2 || !formData.password_3 || !formData.setup_key) {
      toast.error("All fields are required");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.post("/admin/setup", formData);
      
      if (response.data.success) {
        toast.success("Admin user created successfully!");
        setFormData({
          email: "",
          name: "",
          password_1: "",
          password_2: "",
          password_3: "",
          setup_key: "",
        });
        
        // Optionally redirect to login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create admin user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>
            Create a new admin user with 3-step authentication
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              This is a temporary setup page. Disable it after creating your admin accounts.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Admin Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Admin User"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password_1">Password 1 (First Step)</Label>
              <div className="relative">
                <Input
                  id="password_1"
                  type={showPasswords.password_1 ? "text" : "password"}
                  value={formData.password_1}
                  onChange={(e) => handleChange("password_1", e.target.value)}
                  placeholder="Enter first password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => togglePasswordVisibility("password_1")}
                >
                  {showPasswords.password_1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password_2">Password 2 (Second Step)</Label>
              <div className="relative">
                <Input
                  id="password_2"
                  type={showPasswords.password_2 ? "text" : "password"}
                  value={formData.password_2}
                  onChange={(e) => handleChange("password_2", e.target.value)}
                  placeholder="Enter second password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => togglePasswordVisibility("password_2")}
                >
                  {showPasswords.password_2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password_3">Password 3 (Third Step)</Label>
              <div className="relative">
                <Input
                  id="password_3"
                  type={showPasswords.password_3 ? "text" : "password"}
                  value={formData.password_3}
                  onChange={(e) => handleChange("password_3", e.target.value)}
                  placeholder="Enter third password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => togglePasswordVisibility("password_3")}
                >
                  {showPasswords.password_3 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="setup_key">Setup Key</Label>
              <div className="relative">
                <Input
                  id="setup_key"
                  type={showPasswords.setup_key ? "text" : "password"}
                  value={formData.setup_key}
                  onChange={(e) => handleChange("setup_key", e.target.value)}
                  placeholder="Enter setup key"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => togglePasswordVisibility("setup_key")}
                >
                  {showPasswords.setup_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Default: ieosuia_admin_setup_2025
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Admin User"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
