import { Link } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import { CreditsWidget } from "@/components/credits/CreditsWidget";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { ApiErrorFallback } from "@/components/ApiErrorFallback";
import {
  DollarSign,
  FileText,
  Clock,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useDashboardStats, useRecentInvoices, useTopClients } from "@/hooks/useReports";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: recentInvoices = [], isLoading: invoicesLoading } = useRecentInvoices(5);
  const { data: topClients = [], isLoading: clientsLoading } = useTopClients(4);

  const isLoading = statsLoading && invoicesLoading && clientsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader title="Dashboard" subtitle="Welcome back! Here's your business overview." />
          <main className="p-6">
            <PageLoadingSpinner message="Loading dashboard..." />
          </main>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-success/10 text-success";
      case "Pending":
        return "bg-warning/10 text-warning";
      case "Overdue":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: stats ? formatCurrency(stats.total_revenue) : "R0",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Total Invoices",
      value: stats?.total_invoices?.toString() || "0",
      change: `${stats?.paid_invoices || 0} paid`,
      changeType: "positive" as const,
      icon: FileText,
    },
    {
      title: "Outstanding",
      value: stats ? formatCurrency(stats.outstanding) : "R0",
      change: `${stats?.overdue_count || 0} overdue`,
      changeType: stats?.overdue_count ? "negative" as const : "positive" as const,
      icon: Clock,
    },
    {
      title: "Active Clients",
      value: stats?.active_clients?.toString() || "0",
      change: "Active",
      changeType: "positive" as const,
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Dashboard" subtitle="Welcome back! Here's your business overview." />
        
        <main className="p-6">
          {/* Quick Actions */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <Link to="/invoices">
              <Button variant="accent">
                <Plus className="w-4 h-4" />
                New Invoice
              </Button>
            </Link>
          </div>

          {/* Error State */}
          {statsError && (
            <ApiErrorFallback
              error={statsError instanceof Error ? statsError : null}
              onRetry={() => refetchStats()}
              title="Failed to load dashboard stats"
              description="There was a problem fetching your dashboard data. Please try again."
            />
          )}

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : (
              statCards.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))
            )}
          </div>

          {/* Credits Widget */}
          <div className="mb-8">
            <CreditsWidget />
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Invoices */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-soft">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Recent Invoices</h3>
                <Link to="/invoices">
                  <Button variant="ghost" size="sm" className="text-accent">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Invoice</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        </tr>
                      ))
                    ) : recentInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No invoices yet. Create your first invoice!
                        </td>
                      </tr>
                    ) : (
                      recentInvoices.map((invoice: any) => (
                        <tr key={invoice.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-sm font-medium text-foreground">{invoice.invoice_number || invoice.id}</td>
                          <td className="p-4 text-sm text-foreground">{invoice.client?.name || invoice.clientName}</td>
                          <td className="p-4 text-sm font-medium text-foreground">{formatCurrency(invoice.total)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{formatDate(invoice.date)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Clients */}
            <div className="bg-card rounded-xl border border-border shadow-soft">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Top Clients</h3>
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div className="p-4">
                {clientsLoading ? (
                  <ul className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <li key={i} className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-5 w-20" />
                      </li>
                    ))}
                  </ul>
                ) : topClients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No client data yet.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {topClients.map((client: any, index: number) => (
                      <li key={client.name} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">Top performer</p>
                        </div>
                        <p className="font-semibold text-foreground">{formatCurrency(client.revenue)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
