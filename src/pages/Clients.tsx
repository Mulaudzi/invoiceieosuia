import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Mail,
  Trash2,
  Building2,
  Phone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Clients = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const clients = [
    {
      id: 1,
      name: "Acme Corp",
      email: "billing@acme.com",
      phone: "+1 (555) 123-4567",
      company: "Acme Corporation",
      totalInvoices: 24,
      totalRevenue: "$45,200",
      status: "Active",
    },
    {
      id: 2,
      name: "TechStart Inc",
      email: "finance@techstart.io",
      phone: "+1 (555) 234-5678",
      company: "TechStart Inc",
      totalInvoices: 18,
      totalRevenue: "$32,800",
      status: "Active",
    },
    {
      id: 3,
      name: "Global Solutions",
      email: "ap@globalsolutions.com",
      phone: "+1 (555) 345-6789",
      company: "Global Solutions Ltd",
      totalInvoices: 15,
      totalRevenue: "$28,500",
      status: "Active",
    },
    {
      id: 4,
      name: "Creative Agency",
      email: "admin@creative.co",
      phone: "+1 (555) 456-7890",
      company: "Creative Agency Co",
      totalInvoices: 12,
      totalRevenue: "$18,900",
      status: "Active",
    },
    {
      id: 5,
      name: "DataFlow Ltd",
      email: "accounts@dataflow.io",
      phone: "+1 (555) 567-8901",
      company: "DataFlow Limited",
      totalInvoices: 9,
      totalRevenue: "$15,400",
      status: "Inactive",
    },
    {
      id: 6,
      name: "StartupXYZ",
      email: "cfo@startupxyz.com",
      phone: "+1 (555) 678-9012",
      company: "StartupXYZ Inc",
      totalInvoices: 6,
      totalRevenue: "$8,200",
      status: "Active",
    },
  ];

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Clients" subtitle="Manage your client relationships" />

        <main className="p-6">
          {/* Actions Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="accent">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </div>

          {/* Clients Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-card rounded-xl border border-border p-6 shadow-soft card-hover"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{client.name}</h3>
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{client.phone}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="text-lg font-bold text-foreground">{client.totalRevenue}</p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{client.totalInvoices}</p>
                    <p className="text-xs text-muted-foreground">Invoices</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      client.status === "Active"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {client.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No clients found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or add a new client
              </p>
              <Button variant="accent">
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Clients;
