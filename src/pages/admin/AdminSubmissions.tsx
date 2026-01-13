import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Inbox, 
  Mail, 
  BarChart3, 
  LogOut, 
  RefreshCw,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "./AdminLogin";
import api from "@/services/api";

interface Submission {
  id: number;
  name: string;
  email: string;
  message: string;
  purpose: 'general' | 'support' | 'sales';
  origin: string;
  status: 'new' | 'read' | 'responded' | 'archived';
  ip_address: string;
  created_at: string;
  responded_at: string | null;
  notes: string | null;
}

interface PaginatedResponse {
  data: Submission[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

const AdminSubmissions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    purpose: '',
  });

  const fetchSubmissions = async (page = 1) => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.purpose) params.append('purpose', filters.purpose);

      const response = await api.get<PaginatedResponse>(`/admin/submissions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSubmissions(response.data.data);
      setPagination({
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        total: response.data.total,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate('/admin/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filters]);

  const handleLogout = () => {
    removeAdminToken();
    navigate('/admin/login');
  };

  const handleMarkAsRead = async (id: number) => {
    const token = getAdminToken();
    try {
      await api.post(`/admin/submissions/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubmissions(pagination.currentPage);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as read",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    const token = getAdminToken();
    try {
      await api.delete(`/admin/submissions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: "Deleted",
        description: "Submission has been deleted",
      });
      fetchSubmissions(pagination.currentPage);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete submission",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-accent/20 text-accent';
      case 'read': return 'bg-blue-100 text-blue-700';
      case 'responded': return 'bg-green-100 text-green-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'general': return 'bg-blue-100 text-blue-700';
      case 'support': return 'bg-orange-100 text-orange-700';
      case 'sales': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 py-3">
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </Link>
            <Link 
              to="/admin/submissions" 
              className="flex items-center gap-2 text-accent font-medium"
            >
              <Inbox className="w-4 h-4" />
              Submissions
            </Link>
            <Link 
              to="/admin/email-logs" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Logs
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5" />
                Contact Submissions ({pagination.total})
              </CardTitle>
              <div className="flex items-center gap-3">
                <Select 
                  value={filters.status} 
                  onValueChange={(v) => setFilters({ ...filters, status: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={filters.purpose} 
                  onValueChange={(v) => setFilters({ ...filters, purpose: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => fetchSubmissions()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No submissions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div 
                    key={sub.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      sub.status === 'new' ? 'bg-accent/5 border-accent/30' : 'bg-card border-border'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{sub.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(sub.status)}`}>
                            {sub.status}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPurposeColor(sub.purpose)}`}>
                            {sub.purpose}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{sub.email}</p>
                        <p className="text-sm mt-2 line-clamp-2">{sub.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(sub.created_at)} • ID: #{sub.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.status === 'new' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleMarkAsRead(sub.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        <Link to={`/admin/submissions/${sub.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(sub.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.lastPage > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.lastPage}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => fetchSubmissions(pagination.currentPage - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.lastPage}
                    onClick={() => fetchSubmissions(pagination.currentPage + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminSubmissions;