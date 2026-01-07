import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { invoiceService, clientService, statsService } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { FileText, TrendingUp, Users, DollarSign } from "lucide-react";

const Reports = () => {
  const { user } = useAuth();

  const invoices = user ? invoiceService.getAll(user.id) : [];
  const clients = user ? clientService.getAll(user.id) : [];
  const stats = user ? statsService.getDashboardStats(user.id) : null;

  // Monthly revenue data
  const monthlyData = [
    { month: "Jan", revenue: 245000 },
    { month: "Feb", revenue: 312000 },
    { month: "Mar", revenue: 287000 },
    { month: "Apr", revenue: 356000 },
    { month: "May", revenue: 298000 },
    { month: "Jun", revenue: 423000 },
  ];

  // Invoice status breakdown
  const statusData = [
    { name: "Paid", value: invoices.filter(i => i.status === "Paid").length, color: "hsl(var(--success))" },
    { name: "Pending", value: invoices.filter(i => i.status === "Pending").length, color: "hsl(var(--warning))" },
    { name: "Overdue", value: invoices.filter(i => i.status === "Overdue").length, color: "hsl(var(--destructive))" },
    { name: "Draft", value: invoices.filter(i => i.status === "Draft").length, color: "hsl(var(--muted-foreground))" },
  ].filter(s => s.value > 0);

  // Top clients by revenue
  const clientRevenue = clients.map(client => {
    const clientInvoices = invoices.filter(i => i.clientId === client.id && i.status === "Paid");
    return {
      name: client.name,
      revenue: clientInvoices.reduce((sum, i) => sum + i.total, 0),
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Reports" subtitle="Insights and analytics for your business" />

        <main className="p-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.totalRevenue || 0)}</p>
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
                  <p className="text-2xl font-bold text-foreground">{stats?.totalInvoices || 0}</p>
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
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.outstanding || 0)}</p>
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
                  <p className="text-2xl font-bold text-foreground">{stats?.activeClients || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Revenue Chart */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-6">Monthly Revenue</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
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
                    <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Invoice Status Pie Chart */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-6">Invoice Status</h3>
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
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
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
                  <div key={status.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="text-sm text-muted-foreground">{status.name}: {status.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Clients */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
            <h3 className="font-semibold text-foreground mb-6">Top Clients by Revenue</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientRevenue} layout="vertical">
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
