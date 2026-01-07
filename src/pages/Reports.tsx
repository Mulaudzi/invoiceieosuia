import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardStats, useMonthlyRevenue, useInvoiceStatus, useTopClients, useIncomeExpense } from "@/hooks/useReports";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { ApiErrorFallback } from "@/components/ApiErrorFallback";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { FileText, TrendingUp, Users, DollarSign, Download, Calendar } from "lucide-react";

const Reports = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useDashboardStats();
  const { data: monthlyRevenue = [], isLoading: revenueLoading } = useMonthlyRevenue(selectedYear);
  const { data: invoiceStatus = [], isLoading: statusLoading } = useInvoiceStatus();
  const { data: topClients = [], isLoading: clientsLoading } = useTopClients(5);
  const { data: incomeExpense, isLoading: incomeLoading } = useIncomeExpense();

  const isLoading = statsLoading && revenueLoading && statusLoading && clientsLoading && incomeLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader title="Reports" subtitle="Insights and analytics for your business" />
          <main className="p-6">
            <PageLoadingSpinner message="Loading reports..." />
          </main>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader title="Reports" subtitle="Insights and analytics for your business" />
          <main className="p-6">
            <ApiErrorFallback
              error={statsError instanceof Error ? statsError : null}
              onRetry={() => refetch()}
              title="Failed to load reports"
              description="There was a problem fetching your reports data. Please try again."
            />
          </main>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;

  // Color mapping for invoice statuses
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

  // Format top clients for chart
  const clientChartData = topClients.map(c => ({
    name: c.client?.name || "Unknown",
    revenue: c.total || 0,
  }));

  // Income/Expense chart data
  const incomeChartData = incomeExpense?.by_month || [];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Reports" subtitle="Insights and analytics for your business" />

        <main className="p-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.total_revenue || 0)}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stats?.total_invoices || 0}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.outstanding || 0)}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stats?.active_clients || 0}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Revenue Chart */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-6">Monthly Revenue ({selectedYear})</h3>
              {revenueLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRevenue}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R${v/1000}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Invoice Status Pie Chart */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-6">Invoice Status</h3>
              {statusLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="status"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [value, name]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {statusData.map((status) => (
                      <div key={status.status} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-sm text-muted-foreground">{status.status}: {status.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Income vs Expense + Top Clients */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Income vs Expense */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-4">Income Overview</h3>
              {incomeLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-success/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Income</p>
                      <p className="text-lg font-bold text-success">{formatCurrency(incomeExpense?.income || 0)}</p>
                    </div>
                    <div className="text-center p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Expenses</p>
                      <p className="text-lg font-bold text-destructive">{formatCurrency(incomeExpense?.expenses || 0)}</p>
                    </div>
                    <div className="text-center p-3 bg-accent/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Net</p>
                      <p className="text-lg font-bold text-accent">{formatCurrency(incomeExpense?.net || 0)}</p>
                    </div>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R${v/1000}k`} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>

            {/* Top Clients */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-6">Top Clients by Revenue</h3>
              {clientsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R${v/1000}k`} />
                      <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" width={100} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
