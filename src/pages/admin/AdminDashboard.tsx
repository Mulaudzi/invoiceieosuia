import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Inbox, 
  Mail, 
  BarChart3, 
  LogOut, 
  RefreshCw,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Send,
  Settings,
  Percent,
  Timer,
  Calendar,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "./AdminLogin";
import api from "@/services/api";

interface DashboardStats {
  submissions: {
    total: number;
    new: number;
    read: number;
    responded: number;
    archived: number;
    today: number;
    this_week: number;
    this_month: number;
    response_rate: number;
    avg_response_hours: number | null;
    by_purpose: {
      general: number;
      support: number;
      sales: number;
    };
    daily_trend: { date: string; count: number }[];
  };
  emails: {
    total: number;
    sent: number;
    failed: number;
    bounced: number;
    pending: number;
    delivery_rate: number;
    bounce_rate: number;
  };
  recent_submissions: any[];
  recent_failed_emails: any[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate('/admin/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to load dashboard",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDashboard}
                className="text-primary-foreground hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
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
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 py-3">
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-2 text-accent font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </Link>
            <Link 
              to="/admin/submissions" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Inbox className="w-4 h-4" />
              Submissions
              {stats && stats.submissions.new > 0 && (
                <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                  {stats.submissions.new}
                </span>
              )}
            </Link>
            <Link 
              to="/admin/email-logs" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Logs
            </Link>
            <Link 
              to="/admin/settings" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Submissions
              </CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.submissions.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.submissions.today || 0} today
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New (Unread)
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats?.submissions.new || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Emails Sent
              </CardTitle>
              <Send className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.emails.sent || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Delivered successfully
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Emails
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats?.emails.failed || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Response Rate
              </CardTitle>
              <Percent className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.submissions.response_rate || 0}%</div>
              <Progress 
                value={stats?.submissions.response_rate || 0} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.submissions.responded || 0} of {stats?.submissions.total || 0} responded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Response Time
              </CardTitle>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.submissions.avg_response_hours !== null 
                  ? `${stats.submissions.avg_response_hours}h`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average time to respond
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Email Delivery Rate
              </CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.emails.delivery_rate || 0}%</div>
              <Progress 
                value={stats?.emails.delivery_rate || 0} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.emails.sent || 0} delivered successfully
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bounce Rate
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${(stats?.emails.bounce_rate || 0) > 5 ? 'text-destructive' : 'text-green-600'}`}>
                {stats?.emails.bounce_rate || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.emails.bounced || 0} emails bounced
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Time-Based Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.submissions.today || 0}</div>
              <p className="text-xs text-muted-foreground">submissions today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.submissions.this_week || 0}</div>
              <p className="text-xs text-muted-foreground">submissions this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-500" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.submissions.this_month || 0}</div>
              <p className="text-xs text-muted-foreground">submissions this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Purpose Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                General Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.submissions.by_purpose.general || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Support Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.submissions.by_purpose.support || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Sales Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.submissions.by_purpose.sales || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5" />
                Recent Submissions
              </CardTitle>
              <CardDescription>Latest contact form submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recent_submissions && stats.recent_submissions.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_submissions.map((sub: any) => (
                    <Link 
                      key={sub.id} 
                      to={`/admin/submissions/${sub.id}`}
                      className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{sub.name}</p>
                          <p className="text-xs text-muted-foreground">{sub.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sub.status === 'new' ? 'bg-accent/20 text-accent' :
                            sub.status === 'read' ? 'bg-blue-100 text-blue-700' :
                            sub.status === 'responded' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {sub.status}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sub.purpose === 'general' ? 'bg-blue-100 text-blue-700' :
                            sub.purpose === 'support' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {sub.purpose}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(sub.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No submissions yet
                </p>
              )}
              <Link to="/admin/submissions">
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View All Submissions
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Failed Emails */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Recent Failed Emails
              </CardTitle>
              <CardDescription>Emails that failed to send</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recent_failed_emails && stats.recent_failed_emails.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_failed_emails.map((email: any) => (
                    <div 
                      key={email.id}
                      className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                    >
                      <p className="font-medium text-sm">{email.recipient_email}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {email.subject}
                      </p>
                      <p className="text-xs text-destructive mt-1">
                        {email.error_message || 'Unknown error'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(email.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No failed emails
                  </p>
                </div>
              )}
              <Link to="/admin/email-logs">
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View All Email Logs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;