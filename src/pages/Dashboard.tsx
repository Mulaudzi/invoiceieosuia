import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  FileText,
  Clock,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Revenue",
      value: "$124,500",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Total Invoices",
      value: "256",
      change: "+8.2%",
      changeType: "positive" as const,
      icon: FileText,
    },
    {
      title: "Outstanding",
      value: "$8,420",
      change: "-5.1%",
      changeType: "negative" as const,
      icon: Clock,
    },
    {
      title: "Active Clients",
      value: "48",
      change: "+3",
      changeType: "positive" as const,
      icon: Users,
    },
  ];

  const recentInvoices = [
    { id: "INV-001", client: "Acme Corp", amount: "$2,500", status: "Paid", date: "Jan 15, 2024" },
    { id: "INV-002", client: "TechStart Inc", amount: "$1,800", status: "Pending", date: "Jan 14, 2024" },
    { id: "INV-003", client: "Global Solutions", amount: "$3,200", status: "Overdue", date: "Jan 10, 2024" },
    { id: "INV-004", client: "Creative Agency", amount: "$950", status: "Paid", date: "Jan 08, 2024" },
    { id: "INV-005", client: "DataFlow Ltd", amount: "$4,100", status: "Pending", date: "Jan 05, 2024" },
  ];

  const topClients = [
    { name: "Acme Corp", revenue: "$45,200", invoices: 24 },
    { name: "TechStart Inc", revenue: "$32,800", invoices: 18 },
    { name: "Global Solutions", revenue: "$28,500", invoices: 15 },
    { name: "Creative Agency", revenue: "$18,900", invoices: 12 },
  ];

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Dashboard" subtitle="Welcome back! Here's your business overview." />
        
        <main className="p-6">
          {/* Quick Actions */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <Button variant="accent">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Invoices */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-soft">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Recent Invoices</h3>
                <Button variant="ghost" size="sm" className="text-accent">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
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
                    {recentInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-sm font-medium text-foreground">{invoice.id}</td>
                        <td className="p-4 text-sm text-foreground">{invoice.client}</td>
                        <td className="p-4 text-sm font-medium text-foreground">{invoice.amount}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{invoice.date}</td>
                      </tr>
                    ))}
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
                <ul className="space-y-4">
                  {topClients.map((client, index) => (
                    <li key={client.name} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.invoices} invoices</p>
                      </div>
                      <p className="font-semibold text-foreground">{client.revenue}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
