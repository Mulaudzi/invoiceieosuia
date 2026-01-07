import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const invoices = [
    { id: "INV-001", client: "Acme Corp", email: "billing@acme.com", amount: "$2,500.00", status: "Paid", date: "Jan 15, 2024", dueDate: "Feb 15, 2024" },
    { id: "INV-002", client: "TechStart Inc", email: "finance@techstart.io", amount: "$1,800.00", status: "Pending", date: "Jan 14, 2024", dueDate: "Feb 14, 2024" },
    { id: "INV-003", client: "Global Solutions", email: "ap@globalsolutions.com", amount: "$3,200.00", status: "Overdue", date: "Jan 10, 2024", dueDate: "Jan 25, 2024" },
    { id: "INV-004", client: "Creative Agency", email: "admin@creative.co", amount: "$950.00", status: "Paid", date: "Jan 08, 2024", dueDate: "Feb 08, 2024" },
    { id: "INV-005", client: "DataFlow Ltd", email: "accounts@dataflow.io", amount: "$4,100.00", status: "Pending", date: "Jan 05, 2024", dueDate: "Feb 05, 2024" },
    { id: "INV-006", client: "StartupXYZ", email: "cfo@startupxyz.com", amount: "$1,250.00", status: "Draft", date: "Jan 04, 2024", dueDate: "Feb 04, 2024" },
    { id: "INV-007", client: "Enterprise Co", email: "payments@enterprise.com", amount: "$8,500.00", status: "Paid", date: "Jan 02, 2024", dueDate: "Feb 02, 2024" },
    { id: "INV-008", client: "Local Business", email: "owner@localbiz.com", amount: "$620.00", status: "Pending", date: "Jan 01, 2024", dueDate: "Feb 01, 2024" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-success/10 text-success";
      case "Pending":
        return "bg-warning/10 text-warning";
      case "Overdue":
        return "bg-destructive/10 text-destructive";
      case "Draft":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Invoices" subtitle="Create, manage, and track your invoices" />

        <main className="p-6">
          {/* Actions Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
            <Button variant="accent">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "All Invoices", value: "256", color: "bg-foreground" },
              { label: "Paid", value: "180", color: "bg-success" },
              { label: "Pending", value: "52", color: "bg-warning" },
              { label: "Overdue", value: "24", color: "bg-destructive" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Invoices Table */}
          <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Invoice</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Due Date</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-medium text-foreground">{invoice.id}</span>
                      </td>
                      <td className="p-4 text-foreground">{invoice.client}</td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{invoice.email}</td>
                      <td className="p-4 font-medium text-foreground">{invoice.amount}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground hidden lg:table-cell">{invoice.date}</td>
                      <td className="p-4 text-muted-foreground hidden lg:table-cell">{invoice.dueDate}</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="w-4 h-4 mr-2" />
                              Send
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredInvoices.length} of {invoices.length} invoices
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Invoices;
