import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  LayoutDashboard,
  Inbox,
  Mail,
  Settings,
  LogOut,
  RefreshCw,
  Bug,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "./AdminLogin";
import api from "@/services/api";
import { format } from "date-fns";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  status: 'active' | 'inactive';
  last_login_at: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password_1: "",
    password_2: "",
    password_3: "",
  });
  
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password_1: "",
    password_2: "",
    password_3: "",
    setup_key: "",
  });
  
  const [showPasswords, setShowPasswords] = useState({
    password_1: false,
    password_2: false,
    password_3: false,
    setup_key: false,
  });

  const fetchAdmins = async () => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate('/admin/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch admin users",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleLogout = () => {
    removeAdminToken();
    navigate('/admin/login');
  };

  const handleEdit = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditForm({
      name: admin.name,
      email: admin.email,
      password_1: "",
      password_2: "",
      password_3: "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;
    
    const token = getAdminToken();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const updateData: any = {};
      if (editForm.name !== selectedAdmin.name) updateData.name = editForm.name;
      if (editForm.email !== selectedAdmin.email) updateData.email = editForm.email;
      if (editForm.password_1 && editForm.password_2 && editForm.password_3) {
        updateData.password_1 = editForm.password_1;
        updateData.password_2 = editForm.password_2;
        updateData.password_3 = editForm.password_3;
      }

      if (Object.keys(updateData).length === 0) {
        toast({ title: "No changes", description: "No fields were modified" });
        setIsEditModalOpen(false);
        return;
      }

      await api.put(`/admin/users/${selectedAdmin.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ title: "Success", description: "Admin user updated successfully" });
      setIsEditModalOpen(false);
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update admin",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    const token = getAdminToken();
    if (!token) return;

    try {
      await api.patch(`/admin/users/${admin.id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: "Success",
        description: `Admin ${admin.status === 'active' ? 'deactivated' : 'activated'}`,
      });
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to toggle status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    
    const token = getAdminToken();
    if (!token) return;

    try {
      await api.delete(`/admin/users/${selectedAdmin.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ title: "Success", description: "Admin user deleted" });
      setIsDeleteDialogOpen(false);
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete admin",
        variant: "destructive",
      });
    }
  };

  const handleAddAdmin = async () => {
    if (!addForm.email || !addForm.name || !addForm.password_1 || !addForm.password_2 || !addForm.password_3 || !addForm.setup_key) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/admin/setup', addForm);

      toast({ title: "Success", description: "Admin user created successfully" });
      setIsAddModalOpen(false);
      setAddForm({
        name: "",
        email: "",
        password_1: "",
        password_2: "",
        password_3: "",
        setup_key: "",
      });
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create admin",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Inbox, label: "Submissions", path: "/admin/submissions" },
    { icon: Mail, label: "Email Logs", path: "/admin/email-logs" },
    { icon: Users, label: "Admin Users", path: "/admin/users", active: true },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
    { icon: Bug, label: "QA Console", path: "/admin/qa" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">Admin Panel</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <Button
          variant="ghost"
          className="justify-start gap-3 mt-auto"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Users</h1>
              <p className="text-muted-foreground">Manage administrator accounts</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAdmins} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Administrators</CardTitle>
              <CardDescription>
                {admins.length} admin user{admins.length !== 1 ? 's' : ''} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No admin users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Badge variant={admin.status === 'active' ? 'default' : 'secondary'}>
                            {admin.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {admin.last_login_at
                            ? format(new Date(admin.last_login_at), "MMM d, yyyy HH:mm")
                            : "Never"
                          }
                        </TableCell>
                        <TableCell>
                          {format(new Date(admin.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(admin)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(admin)}
                              title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {admin.status === 'active' ? (
                                <ShieldOff className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <Shield className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(admin)}
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
            <DialogDescription>
              Update admin details. Leave password fields empty to keep current passwords.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Change passwords (all three required to update)
              </p>
              
              {[1, 2, 3].map((num) => (
                <div key={num} className="space-y-2 mb-3">
                  <Label htmlFor={`edit-password-${num}`}>Password {num}</Label>
                  <div className="relative">
                    <Input
                      id={`edit-password-${num}`}
                      type={showPasswords[`password_${num}` as keyof typeof showPasswords] ? "text" : "password"}
                      value={editForm[`password_${num}` as keyof typeof editForm]}
                      onChange={(e) => setEditForm(prev => ({ ...prev, [`password_${num}`]: e.target.value }))}
                      placeholder="Leave empty to keep current"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => togglePasswordVisibility(`password_${num}` as keyof typeof showPasswords)}
                    >
                      {showPasswords[`password_${num}` as keyof typeof showPasswords] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmin} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Create a new administrator with 3-step authentication.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Admin name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@example.com"
              />
            </div>
            
            {[1, 2, 3].map((num) => (
              <div key={num} className="space-y-2">
                <Label htmlFor={`add-password-${num}`}>Password {num}</Label>
                <div className="relative">
                  <Input
                    id={`add-password-${num}`}
                    type={showPasswords[`password_${num}` as keyof typeof showPasswords] ? "text" : "password"}
                    value={addForm[`password_${num}` as keyof typeof addForm]}
                    onChange={(e) => setAddForm(prev => ({ ...prev, [`password_${num}`]: e.target.value }))}
                    placeholder={`Enter password ${num}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => togglePasswordVisibility(`password_${num}` as keyof typeof showPasswords)}
                  >
                    {showPasswords[`password_${num}` as keyof typeof showPasswords] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="space-y-2">
              <Label htmlFor="add-setup-key">Setup Key</Label>
              <div className="relative">
                <Input
                  id="add-setup-key"
                  type={showPasswords.setup_key ? "text" : "password"}
                  value={addForm.setup_key}
                  onChange={(e) => setAddForm(prev => ({ ...prev, setup_key: e.target.value }))}
                  placeholder="Enter setup key"
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
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAdmin?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
