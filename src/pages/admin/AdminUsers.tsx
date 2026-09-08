import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  RefreshCw,
  Eye,
  EyeOff,
} from "@/lib/icons";
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
import { getAdminToken, removeAdminToken } from "@/services/adminAuth";
import api from "@/services/api";
import { formatDateSafe } from "@/lib/dateUtils";
import AdminLayout from "@/components/admin/AdminLayout";

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
  
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);

  const fetchAdmins = async () => {
    const token = getAdminToken();
    if (!token) {
      navigate('/guymhan/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/guymhan/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate('/guymhan/login');
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

  const handleEdit = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditForm({
      name: admin.name,
      email: admin.email,
      password: "",
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
      if (editForm.password) updateData.password = editForm.password;

      if (Object.keys(updateData).length === 0) {
        toast({ title: "No changes", description: "No fields were modified" });
        setIsEditModalOpen(false);
        return;
      }

      await api.put(`/guymhan/users/${selectedAdmin.id}`, updateData, {
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
      await api.patch(`/guymhan/users/${admin.id}/toggle`, {}, {
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
      await api.delete(`/guymhan/users/${selectedAdmin.id}`, {
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
    if (!addForm.email || !addForm.name || !addForm.password) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAdminToken();
      if (!token) {
        navigate('/guymhan/login');
        return;
      }

      await api.post('/guymhan/users', addForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({ title: "Success", description: "Admin user created successfully" });
      setIsAddModalOpen(false);
      setAddForm({
        name: "",
        email: "",
        password: "",
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

  return (
    <AdminLayout>
      <main className="p-6">
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
                            ? formatDateSafe(admin.last_login_at, "MMM d, yyyy HH:mm")
                            : "Never"
                          }
                        </TableCell>
                        <TableCell>
                          {formatDateSafe(admin.created_at, "MMM d, yyyy")}
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
              Update admin details. Leave the password empty to keep the current password.
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
                Change password
              </p>
              
                <div className="space-y-2 mb-3">
                  <Label htmlFor="edit-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showPassword ? "text" : "password"}
                      value={editForm.password}
                      onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Leave empty to keep current"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
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
            <DialogTitle>Add New Admin</DialogTitle>
            <DialogDescription>
              Create a new administrator account. Requires setup key.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
              <div className="space-y-2">
                <Label htmlFor="add-password">Password</Label>
                <div className="relative">
                  <Input
                    id="add-password"
                    type={showPassword ? "text" : "password"}
                    value={addForm.password}
                    onChange={(e) => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
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
    </AdminLayout>
  );
};

export default AdminUsers;
