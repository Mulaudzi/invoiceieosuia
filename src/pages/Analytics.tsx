import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardStats, useMonthlyRevenue, useInvoiceStatus, useTopClients } from "@/hooks/useReports";
import { useCredits } from "@/hooks/useCredits";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from "recharts";
import {
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  MessageSquare,
  Percent,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Analytics = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: monthlyRevenue = [], isLoading: revenueLoading } = useMonthlyRevenue(selectedYear);
  const { data: invoiceStatus = [], isLoading: statusLoading } = useInvoiceStatus();
  const { data: topClients = [], isLoading: clientsLoading } = useTopClients(10);
  const { data: credits } = useCredits();

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;

  const statusColors: Record<string, string> = {
    Paid: "hsl(var(--success))",
    paid: "hsl(var(--success))",
    Pending: "hsl(var(--warning))",
    pending: "hsl(var(--warning))",
    Overdue: "hsl(var(--destructive))",
    overdue: "hsl(var(--destructive))",
    Draft: "hsl(var(--muted-foreground))",
    draft: "hsl(var(--muted-foreground))",
  };

  const statusData = invoiceStatus.map(s => ({
    ...s,
    color: statusColors[s.status] || "hsl(var(--muted-foreground))",
  }));

  // Calculate metrics
  const totalInvoices = stats?.total_invoices || 0;
  const paidInvoices = stats?.paid_invoices || 0;
  const collectionRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;
  const avgInvoiceValue = totalInvoices > 0 ? (stats?.total_revenue || 0) / totalInvoices : 0;

  // Payment timeline data (mock - would come from API)
  const paymentTimeline = [
    { name: 'Within 7 days', value: 45, fill: 'hsl(var(--success))' },
    { name: '8-14 days', value: 25, fill: 'hsl(var(--accent))' },
    { name: '15-30 days', value: 20, fill: 'hsl(var(--warning))' },
    { name: '30+ days', value: 10, fill: 'hsl(var(--destructive))' },
  ];

  // Client revenue distribution
  const clientRevenue = topClients.slice(0, 5).map((c: any) => ({
    name: c.client?.name?.split(' ')[0] || 'Unknown',
    revenue: c.total || 0,
  }));

  // Monthly comparison data
  const monthlyComparison = monthlyRevenue.map((m: any, i: number) => ({
    ...m,
    invoices: Math.floor(Math.random() * 20) + 5, // Mock data
    avgValue: m.revenue / (Math.floor(Math.random() * 20) + 5),
  }));

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader
          title="Analytics"
          subtitle="Deep insights into your invoicing performance"
        />

        <main className="p-6">
          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Analytics
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(stats?.total_revenue || 0)}
                      </p>
                    )}
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      +12.5% from last month
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Collection Rate</p>
                    <p className="text-2xl font-bold text-foreground">{collectionRate}%</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      +3.2% improvement
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Percent className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Invoice Value</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(avgInvoiceValue)}
                      </p>
                    )}
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <ArrowDownRight className="w-3 h-3" />
                      -2.1% from last month
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Clients</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{stats?.active_clients || 0}</p>
                    )}
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      +5 new this month
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue over time with invoice count</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyComparison}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R${v/1000}k`} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : value,
                          name === 'revenue' ? 'Revenue' : 'Invoices'
                        ]}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--accent))"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="invoices"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                        name="Invoices"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Invoice Status */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
                <CardDescription>Distribution by payment status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="count"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                      {statusData.map((status) => (
                        <div key={status.status} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                          <span className="text-xs text-muted-foreground">{status.status}: {status.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Timeline</CardTitle>
                <CardDescription>How quickly clients pay</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentTimeline} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" unit="%" />
                      <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, 'Invoices']}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {paymentTimeline.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-success/10 rounded-lg">
                  <p className="text-sm text-success font-medium">70% paid within 14 days</p>
                </div>
              </CardContent>
            </Card>

            {/* Client Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Top Clients</CardTitle>
                <CardDescription>Revenue by client</CardDescription>
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <div className="space-y-3">
                    {clientRevenue.map((client, i) => {
                      const maxRevenue = Math.max(...clientRevenue.map(c => c.revenue));
                      const percentage = (client.revenue / maxRevenue) * 100;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{client.name}</span>
                            <span className="text-sm text-muted-foreground">{formatCurrency(client.revenue)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Credit Usage */}
          {credits && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Usage</CardTitle>
                <CardDescription>Email and SMS credits used this billing period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-info" />
                        <span className="font-medium text-foreground">Email Credits</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {credits.credits.email.used} / {credits.credits.email.monthly_limit} used
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-info rounded-full transition-all"
                        style={{ width: `${(credits.credits.email.used / credits.credits.email.monthly_limit) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-accent" />
                        <span className="font-medium text-foreground">SMS Credits</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {credits.credits.sms.used} / {credits.credits.sms.monthly_limit} used
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${credits.credits.sms.monthly_limit > 0 ? (credits.credits.sms.used / credits.credits.sms.monthly_limit) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default Analytics;
