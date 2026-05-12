import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Copy,
  Check,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "./AdminLogin";
import api from "@/services/api";
import AdminLayout from "@/components/admin/AdminLayout";

interface Setting {
  key: string;
  value: string;
  category: string;
  description: string;
}

interface SettingFormData {
  key: string;
  value: string;
  category: string;
  description: string;
}

const AdminSettingsManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  const [formData, setFormData] = useState<SettingFormData>({
    key: "",
    value: "",
    category: "general",
    description: "",
  });

  const categories = ["general", "mail", "payment", "notification", "security"];

  const fetchSettings = async () => {
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get("/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(response.data || []);
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate("/admin/login");
      }
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      key: "",
      value: "",
      category: "general",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditClick = (setting: Setting) => {
    setEditingId(setting.key);
    setFormData({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      description: setting.description,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.key || !formData.value) {
      toast({
        title: "Validation Error",
        description: "Key and value are required",
        variant: "destructive",
      });
      return;
    }

    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      setIsSaving(true);
      
      if (editingId) {
        // Update existing
        await api.put(`/settings/${formData.key}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({
          title: "Success",
          description: "Setting updated successfully",
        });
      } else {
        // Create new
        await api.post("/settings", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({
          title: "Success",
          description: "Setting created successfully",
        });
      }

      setIsDialogOpen(false);
      await fetchSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save setting",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    if (!confirm(`Delete setting "${key}"?`)) return;

    try {
      await api.delete(`/settings/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "Success",
        description: "Setting deleted successfully",
      });
      await fetchSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete setting",
        variant: "destructive",
      });
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredSettings = settings.filter((setting) => {
    const matchesSearch =
      setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory =
      filterCategory === "all" || setting.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Settings Manager</h1>
              <p className="text-gray-600">Manage application settings and configuration</p>
            </div>
          </div>
          <Button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Setting
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search settings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={fetchSettings}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Settings ({filteredSettings.length})
            </CardTitle>
            <CardDescription>
              View and manage all application settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredSettings.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">No settings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettings.map((setting) => (
                      <TableRow key={setting.key}>
                        <TableCell className="font-mono text-sm">
                          {setting.key}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded max-w-xs truncate">
                              {setting.value}
                            </code>
                            <button
                              onClick={() => handleCopy(setting.value, setting.key)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {copied === setting.key ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {setting.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs">
                          {setting.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(setting)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(setting.key)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Setting" : "Add New Setting"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the setting details below"
                  : "Create a new application setting"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="key">Key (identifier)</Label>
                <Input
                  id="key"
                  placeholder="e.g., smtp_host"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  disabled={!!editingId}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="value">Value</Label>
                <Textarea
                  id="value"
                  placeholder="Enter the setting value"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  className="mt-1 min-h-24"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What is this setting for?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Setting
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsManager;
