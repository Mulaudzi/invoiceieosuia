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
  Activity,
  Bug,
  Monitor,
  Smartphone,
  Globe,
  XCircle,
  Shield,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "./AdminLogin";
import api from "@/services/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/admin/AdminLayout";

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

interface AdminSession {
  id: number;
  session_token_masked: string;
  ip_address: string;
  admin_user_id: number | null;
  admin_name: string;
  admin_email: string;
  last_activity: string;
  last_activity_ago: string;
  created_at: string;
  expires_at: string;
  time_remaining: string;
  is_current: boolean;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [terminatingId, setTerminatingId] = useState<number | null>(null);

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

  const fetchSessions = async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      setSessionsLoading(true);
      const response = await api.get('/admin/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const terminateSession = async (sessionId: number) => {
    const token = getAdminToken();
    if (!token) return;

    try {
      setTerminatingId(sessionId);
      await api.delete(`/admin/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: "Session terminated",
        description: "The session has been terminated successfully.",
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to terminate session",
        variant: "destructive",
      });
    } finally {
      setTerminatingId(null);
    }
  };

  const terminateAllSessions = async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      const response = await api.delete('/admin/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: "Sessions terminated",
        description: response.data.message || "All other sessions have been terminated.",
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to terminate sessions",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchSessions();
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

  const getDeviceIcon = (ipAddress: string) => {
    // Simple heuristic - in reality you'd parse user agent
    if (ipAddress.includes('::1') || ipAddress === '127.0.0.1') {
      return <Monitor className="w-4 h-4" />;
    }
    return <Globe className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Overview</h1>
              <p className="text-muted-foreground text-sm">Monitor your system's performance and activity</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchDashboard(); fetchSessions(); }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
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

        {/* 30-Day Submission Trends Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Submission Trends (Last 30 Days)
            </CardTitle>
            <CardDescription>Daily contact form submissions over the past month</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.submissions.daily_trend && stats.submissions.daily_trend.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.submissions.daily_trend}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
                      }}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={30}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-ZA', { 
                          weekday: 'short',
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        });
                      }}
                      formatter={(value: number) => [`${value} submissions`, 'Total']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorSubmissions)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No submission data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Active Sessions Management */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Active Admin Sessions
                </CardTitle>
                <CardDescription>Manage active admin login sessions across all devices</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSessions}
                  disabled={sessionsLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${sessionsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {sessions.filter(s => !s.is_current).length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Terminate All Others
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Terminate all other sessions?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will immediately log out all other admin sessions except your current one. 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={terminateAllSessions}>
                          Terminate All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sessionsLoading && sessions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div 
                    key={session.id}
                    className={`p-4 rounded-lg border ${
                      session.is_current 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          session.is_current ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {getDeviceIcon(session.ip_address)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{session.admin_name}</p>
                            {session.is_current && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{session.admin_email}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {session.ip_address}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Active {session.last_activity_ago}
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              Expires in {session.time_remaining}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Session: {session.session_token_masked}
                          </p>
                        </div>
                      </div>
                      {!session.is_current && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={terminatingId === session.id}
                            >
                              {terminatingId === session.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Terminate this session?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will immediately log out the admin session from {session.ip_address}. 
                                The user will need to log in again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => terminateSession(session.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Terminate Session
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  No active sessions found
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
};

export default AdminDashboard;