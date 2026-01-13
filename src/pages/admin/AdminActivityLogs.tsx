import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Activity,
  Shield,
  LayoutDashboard,
  Inbox,
  Mail,
  Users,
  Settings,
  LogOut,
  RefreshCw,
  Bug,
  Filter,
  ChevronLeft,
  ChevronRight,
  LogIn,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "./AdminLogin";
import api from "@/services/api";
import { format } from "date-fns";

interface ActivityLog {
  id: number;
  admin_user_id: number | null;
  admin_email: string | null;
  admin_name: string | null;
  action: string;
  category: 'auth' | 'user_management' | 'submission' | 'settings' | 'system';
  target_type: string | null;
  target_id: number | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failed' | 'warning';
  created_at: string;
}

interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

const AdminActivityLogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    per_page: 50,
    total: 0,
    last_page: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [searchAction, setSearchAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = async (page = 1) => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', '50');
      if (category && category !== 'all') params.append('category', category);
      if (status && status !== 'all') params.append('status', status);
      if (searchAction) params.append('action', searchAction);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await api.get(`/admin/activity-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLogs(response.data.data || []);
      setPagination({
        current_page: response.data.current_page,
        per_page: response.data.per_page,
        total: response.data.total,
        last_page: response.data.last_page,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate('/admin/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch activity logs",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [category, status]);

  const handleSearch = () => {
    fetchLogs(1);
  };

  const handleLogout = () => {
    removeAdminToken();
    navigate('/admin/login');
  };

  const getActionIcon = (action: string, category: string) => {
    if (category === 'auth') {
      if (action.includes('login')) return <LogIn className="h-4 w-4" />;
      if (action.includes('logout')) return <LogOut className="h-4 w-4" />;
    }
    if (category === 'user_management') {
      if (action.includes('create')) return <UserPlus className="h-4 w-4" />;
      if (action.includes('delete')) return <UserMinus className="h-4 w-4" />;
      if (action.includes('update') || action.includes('edit')) return <Edit className="h-4 w-4" />;
      if (action.includes('toggle')) return <Shield className="h-4 w-4" />;
    }
    if (category === 'submission') {
      if (action.includes('delete')) return <Trash2 className="h-4 w-4" />;
      if (action.includes('view')) return <Eye className="h-4 w-4" />;
    }
    return <Activity className="h-4 w-4" />;
  };

  const getStatusBadge = (logStatus: string) => {
    switch (logStatus) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 text-white"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      default:
        return <Badge variant="outline">{logStatus}</Badge>;
    }
  };

  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      auth: 'bg-blue-500',
      user_management: 'bg-purple-500',
      submission: 'bg-green-500',
      settings: 'bg-orange-500',
      system: 'bg-gray-500',
    };
    return (
      <Badge variant="secondary" className={`${colors[cat] || 'bg-gray-500'} text-white`}>
        {cat.replace('_', ' ')}
      </Badge>
    );
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Inbox, label: "Submissions", path: "/admin/submissions" },
    { icon: Mail, label: "Email Logs", path: "/admin/email-logs" },
    { icon: Users, label: "Admin Users", path: "/admin/users" },
    { icon: Activity, label: "Activity Logs", path: "/admin/activity-logs", active: true },
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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Activity Logs</h1>
              <p className="text-muted-foreground">Security audit trail for all admin actions</p>
            </div>
            <Button variant="outline" onClick={() => fetchLogs(pagination.current_page)} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="user_management">User Management</SelectItem>
                    <SelectItem value="submission">Submissions</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Search action..."
                  value={searchAction}
                  onChange={(e) => setSearchAction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />

                <Input
                  type="date"
                  placeholder="Start date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="End date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <Button onClick={handleSearch}>
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                {pagination.total} total entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity logs found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{log.admin_name || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">{log.admin_email || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action, log.category)}
                              <span>{formatAction(log.action)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getCategoryBadge(log.category)}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-sm font-mono">{log.ip_address || '-'}</TableCell>
                          <TableCell className="max-w-[200px]">
                            {log.details ? (
                              <span className="text-xs text-muted-foreground truncate block" title={JSON.stringify(log.details)}>
                                {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination.last_page > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {pagination.current_page} of {pagination.last_page}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchLogs(pagination.current_page - 1)}
                          disabled={pagination.current_page <= 1 || isLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchLogs(pagination.current_page + 1)}
                          disabled={pagination.current_page >= pagination.last_page || isLoading}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminActivityLogs;
