import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw,
  Crown,
  Star,
  Zap,
  UserMinus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "./AdminLogin";
import api from "@/services/api";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface SubscriptionMetrics {
  mrr: number;
  mrr_growth: number;
  active_subscribers: number;
  total_users: number;
  churn_rate: number;
  churned_this_month: number;
  new_subscribers_this_month: number;
  upgrades_this_month: number;
  downgrades_this_month: number;
  arpu: number; // Average Revenue Per User
  ltv: number; // Lifetime Value
  plan_distribution: {
    free: number;
    solo: number;
    pro: number;
    business: number;
    enterprise: number;
  };
  mrr_trend: { date: string; mrr: number }[];
  subscriber_trend: { date: string; count: number }[];
  recent_changes: {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    from_plan: string;
    to_plan: string;
    changed_at: string;
    type: 'upgrade' | 'downgrade' | 'new' | 'churn';
  }[];
}

const PLAN_COLORS = {
  free: 'hsl(var(--muted-foreground))',
  solo: 'hsl(var(--warning))',
  pro: 'hsl(var(--primary))',
  business: 'hsl(var(--accent))',
  enterprise: 'hsl(var(--success))',
};

const AdminSubscriptions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/admin/subscription-metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate('/admin/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to load subscription metrics",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'business':
      case 'enterprise':
        return <Crown className="w-4 h-4" />;
      case 'pro':
        return <Star className="w-4 h-4" />;
      case 'solo':
        return <Zap className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'upgrade':
        return <Badge className="bg-success/10 text-success border-success/20">Upgrade</Badge>;
      case 'downgrade':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Downgrade</Badge>;
      case 'new':
        return <Badge className="bg-primary/10 text-primary border-primary/20">New</Badge>;
      case 'churn':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Churned</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const pieData = metrics ? [
    { name: 'Free', value: metrics.plan_distribution.free, color: PLAN_COLORS.free },
    { name: 'Solo', value: metrics.plan_distribution.solo, color: PLAN_COLORS.solo },
    { name: 'Pro', value: metrics.plan_distribution.pro, color: PLAN_COLORS.pro },
    { name: 'Business', value: metrics.plan_distribution.business, color: PLAN_COLORS.business },
    { name: 'Enterprise', value: metrics.plan_distribution.enterprise, color: PLAN_COLORS.enterprise },
  ].filter(item => item.value > 0) : [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Subscription Metrics</h1>
              <p className="text-muted-foreground text-sm">Monitor MRR, churn, and subscriber growth</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchMetrics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Recurring Revenue
              </CardTitle>
              <DollarSign className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(metrics?.mrr || 0)}</div>
              <div className="flex items-center gap-1 mt-1">
                {(metrics?.mrr_growth || 0) >= 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">+{metrics?.mrr_growth}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-destructive">{metrics?.mrr_growth}%</span>
                  </>
                )}
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Subscribers
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.active_subscribers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.new_subscribers_this_month || 0} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Churn Rate
              </CardTitle>
              <UserMinus className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${(metrics?.churn_rate || 0) > 5 ? 'text-destructive' : 'text-foreground'}`}>
                {metrics?.churn_rate || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.churned_this_month || 0} churned this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Revenue Per User
              </CardTitle>
              <Percent className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(metrics?.arpu || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                LTV: {formatCurrency(metrics?.ltv || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Movement Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upgrades</p>
                  <p className="text-2xl font-bold text-success">{metrics?.upgrades_this_month || 0}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Downgrades</p>
                  <p className="text-2xl font-bold text-warning">{metrics?.downgrades_this_month || 0}</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{metrics?.total_users || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* MRR Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                MRR Trend
              </CardTitle>
              <CardDescription>Monthly recurring revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.mrr_trend && metrics.mrr_trend.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.mrr_trend}>
                      <defs>
                        <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-ZA', { month: 'short' })}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tickFormatter={(val) => `R${(val / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'MRR']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="mrr" 
                        stroke="hsl(var(--success))" 
                        fill="url(#mrrGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No MRR data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Plan Distribution
              </CardTitle>
              <CardDescription>Subscribers by plan type</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [value, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No subscription data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Subscription Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Subscription Changes
            </CardTitle>
            <CardDescription>Latest upgrades, downgrades, and churns</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.recent_changes && metrics.recent_changes.length > 0 ? (
              <div className="space-y-3">
                {metrics.recent_changes.map((change) => (
                  <div
                    key={change.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getPlanIcon(change.to_plan)}
                      </div>
                      <div>
                        <p className="font-medium">{change.user_name}</p>
                        <p className="text-sm text-muted-foreground">{change.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground capitalize">{change.from_plan}</span>
                          <ArrowUpRight className="w-4 h-4" />
                          <span className="font-medium capitalize">{change.to_plan}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(change.changed_at).toLocaleDateString('en-ZA', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {getChangeTypeBadge(change.type)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent subscription changes
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
