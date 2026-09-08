import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  AlertCircle,
  X,
} from "@/lib/icons";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "@/services/adminAuth";
import api from "@/services/api";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatDateSafe } from "@/lib/dateUtils";

interface BlockedDomain {
  id: number;
  domain: string;
  reason: string;
  created_at: string;
}

const AdminBlockedDomains = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [domains, setDomains] = useState<BlockedDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [bulkDomains, setBulkDomains] = useState("");

  const [formData, setFormData] = useState({
    domain: "",
    reason: "",
  });

  const fetchDomains = async () => {
    const token = getAdminToken();
    if (!token) {
      navigate("/guymhan/login");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get("/blocked-domains", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDomains(response.data || []);
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate("/guymhan/login");
      }
      toast({
        title: "Error",
        description: "Failed to fetch blocked domains",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddClick = () => {
    setFormData({ domain: "", reason: "" });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.domain) {
      toast({
        title: "Validation Error",
        description: "Domain is required",
        variant: "destructive",
      });
      return;
    }

    const token = getAdminToken();
    if (!token) {
      navigate("/guymhan/login");
      return;
    }

    try {
      setIsSaving(true);
      await api.post("/blocked-domains", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "Success",
        description: "Domain blocked successfully",
      });
      setIsDialogOpen(false);
      await fetchDomains();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to block domain",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkDomains.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one domain",
        variant: "destructive",
      });
      return;
    }

    const domainList = bulkDomains
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d && d.includes("."));

    if (domainList.length === 0) {
      toast({
        title: "Validation Error",
        description: "No valid domains found",
        variant: "destructive",
      });
      return;
    }

    const token = getAdminToken();
    if (!token) {
      navigate("/guymhan/login");
      return;
    }

    try {
      setIsSaving(true);
      await api.post(
        "/blocked-domains/bulk-add",
        { domains: domainList },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast({
        title: "Success",
        description: `${domainList.length} domains blocked successfully`,
      });
      setIsBulkDialogOpen(false);
      setBulkDomains("");
      await fetchDomains();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to block domains",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const token = getAdminToken();
    if (!token) {
      navigate("/guymhan/login");
      return;
    }

    try {
      await api.delete(`/blocked-domains/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "Success",
        description: "Domain unblocked successfully",
      });
      setDeleteId(null);
      await fetchDomains();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to unblock domain",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    const token = getAdminToken();
    if (!token) {
      navigate("/guymhan/login");
      return;
    }

    try {
      const response = await api.get(`/blocked-domains/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const blob = new Blob([JSON.stringify(response.data)], {
        type: format === "json" ? "application/json" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blocked-domains-${Date.now()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Domains exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to export domains",
        variant: "destructive",
      });
    }
  };

  const filteredDomains = domains.filter((domain) =>
    domain.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold">Blocked Domains</h1>
              <p className="text-gray-600">Manage blocked email domains</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Bulk Add
            </Button>
            <Button
              onClick={handleAddClick}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </div>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={fetchDomains}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("csv")}
                disabled={isLoading || domains.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("json")}
                disabled={isLoading || domains.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Domains Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Blocked Domains ({filteredDomains.length})
            </CardTitle>
            <CardDescription>
              {domains.length} total domains blocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredDomains.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">
                  {searchTerm
                    ? "No domains match your search"
                    : "No blocked domains yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDomains.map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-mono">
                          <Badge variant="secondary">
                            {domain.domain}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {domain.reason || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDateSafe(domain.created_at, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(domain.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Domain Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Block Email Domain</DialogTitle>
              <DialogDescription>
                Add a domain to the blocked list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="e.g., spam.com"
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  placeholder="Why is this domain blocked?"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
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
                className="bg-red-600 hover:bg-red-700"
              >
                {isSaving ? "Blocking..." : "Block Domain"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Add Dialog */}
        <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Bulk Block Domains</DialogTitle>
              <DialogDescription>
                Add multiple domains at once (one per line)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="spam.com&#10;disposable.com&#10;tempmail.org"
                value={bulkDomains}
                onChange={(e) => setBulkDomains(e.target.value)}
                className="min-h-32 font-mono text-sm"
              />
              <p className="text-sm text-gray-600">
                {bulkDomains
                  .split("\n")
                  .filter((d) => d.trim() && d.includes(".")).length}{" "}
                valid domains ready to block
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsBulkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAdd}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSaving ? "Blocking..." : "Block Domains"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unblock Domain</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unblock this domain?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Unblock
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminBlockedDomains;
