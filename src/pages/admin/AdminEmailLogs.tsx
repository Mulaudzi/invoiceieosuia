import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Mail, 
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "./AdminLogin";
import api from "@/services/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/admin/AdminLayout";

interface EmailLog {
  id: number;
  submission_id: number | null;
  type: string;
  recipient_email: string;
  recipient_name: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  error_message: string | null;
  bounce_type: string | null;
  bounced_at: string | null;
  sent_at: string | null;
  created_at: string;
}

interface EmailLogsResponse {
  data: EmailLog[];
  current_page: number;
  last_page: number;
  total: number;
}

const AdminEmailLogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchLogs = async (page: number = 1) => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get<EmailLogsResponse>(`/admin/email-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLogs(response.data.data);
      setCurrentPage(response.data.current_page);
      setLastPage(response.data.last_page);
      setTotal(response.data.total);
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate('/admin/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to load email logs",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [statusFilter, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleLogout = async () => {
    const token = getAdminToken();
    try {
      await api.post('/admin/logout', { admin_token: token });
    } catch (e) {
      // Ignore errors
    }
    removeAdminToken();
    navigate('/admin/login');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      toast({
        title: "Exporting...",
        description: "Preparing CSV export",
      });

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await api.get(`/admin/export/email-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data.data;
      if (!data || data.length === 0) {
        toast({
          title: "No data",
          description: "No email logs to export",
          variant: "destructive",
        });
        return;
      }

      // Create CSV content
      const headers = ['ID', 'Recipient', 'Subject', 'Type', 'Status', 'Error', 'Bounce Type', 'Sent At', 'Created At', 'Contact Name', 'Contact Email'];
      const csvRows = [headers.join(',')];
      
      data.forEach((log: any) => {
        const row = [
          log.id,
          `"${log.recipient_email || ''}"`,
          `"${(log.subject || '').replace(/"/g, '""')}"`,
          log.type || '',
          log.status || '',
          `"${(log.error_message || '').replace(/"/g, '""')}"`,
          log.bounce_type || '',
          log.sent_at || '',
          log.created_at || '',
          `"${log.contact_name || ''}"`,
          `"${log.contact_email || ''}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${data.length} email logs to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export email logs",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      toast({
        title: "Generating Report...",
        description: "Preparing PDF report",
      });

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await api.get(`/admin/export/email-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data.data;
      if (!data || data.length === 0) {
        toast({
          title: "No data",
          description: "No email logs to export",
          variant: "destructive",
        });
        return;
      }

      // Create a simple HTML report that can be printed as PDF
      const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Logs Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .meta { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f4f4f4; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .status-sent { color: green; }
            .status-failed { color: red; }
            .status-bounced { color: orange; }
            .status-pending { color: gray; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>Email Logs Report</h1>
          <div class="meta">
            Generated: ${new Date().toLocaleString()}<br>
            Total Records: ${data.length}
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Status</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((log: any) => `
                <tr>
                  <td>${log.id}</td>
                  <td>${log.recipient_email || ''}</td>
                  <td>${log.subject || ''}</td>
                  <td>${log.type || ''}</td>
                  <td class="status-${log.status}">${log.status || ''}</td>
                  <td>${log.sent_at || log.created_at || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      }

      toast({
        title: "Report Generated",
        description: "PDF report opened in new window",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'bounced':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'bounced':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Bounced</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'contact_notification':
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Contact Notification</Badge>;
      case 'contact_confirmation':
        return <Badge variant="outline" className="border-purple-300 text-purple-700">User Confirmation</Badge>;
      case 'admin_notification':
        return <Badge variant="outline" className="border-green-300 text-green-700">Admin Alert</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Email Logs</h1>
              <p className="text-muted-foreground text-sm">Track all outgoing email activity</p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => fetchLogs(currentPage)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Email Delivery Logs
            </CardTitle>
            <CardDescription>
              Track all outgoing emails - sent, failed, and bounced
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
              </form>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                  <option value="bounced">Bounced</option>
                  <option value="pending">Pending</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="contact_notification">Contact Notification</option>
                  <option value="contact_confirmation">User Confirmation</option>
                  <option value="admin_notification">Admin Alert</option>
                </select>
                
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card">
                    <DropdownMenuItem onClick={exportToCSV}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToPDF}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground mb-4">
              Showing {logs.length} of {total} email logs
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No email logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Recipient</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subject</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sent At</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            {getStatusBadge(log.status)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            {(log.contact_name || log.recipient_name) && (
                              <p className="font-medium text-sm">{log.contact_name || log.recipient_name}</p>
                            )}
                            <p className="text-sm text-muted-foreground">{log.recipient_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm max-w-xs truncate">{log.subject}</p>
                        </td>
                        <td className="py-3 px-4">
                          {getTypeBadge(log.type)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(log.sent_at || log.created_at)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          {log.error_message ? (
                            <div>
                              <p className="text-xs text-destructive max-w-xs truncate" title={log.error_message}>
                                {log.error_message}
                              </p>
                              {log.bounce_type && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Bounce type: {log.bounce_type}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {lastPage}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(currentPage + 1)}
                    disabled={currentPage >= lastPage}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
};

export default AdminEmailLogs;
