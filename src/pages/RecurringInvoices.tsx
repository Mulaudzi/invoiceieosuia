import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
  Edit,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecurringInvoices, useDeleteRecurringInvoice, useToggleRecurringStatus, RecurringInvoice } from "@/hooks/useRecurringInvoices";
import { useToast } from "@/hooks/use-toast";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { ApiErrorFallback } from "@/components/ApiErrorFallback";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurringInvoiceModal } from "@/components/invoices/RecurringInvoiceModal";
import { format, parseISO } from "date-fns";

const RecurringInvoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringInvoice | null>(null);
  const { toast } = useToast();
  
  const { data: recurringInvoices = [], isLoading, error, refetch } = useRecurringInvoices();
  const deleteRecurring = useDeleteRecurringInvoice();
  const toggleStatus = useToggleRecurringStatus();

  const handleDelete = async (id: number) => {
    try {
      await deleteRecurring.mutateAsync(id);
      toast({ title: "Recurring invoice deleted" });
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await toggleStatus.mutateAsync({ id, status: newStatus });
      toast({ title: `Recurring invoice ${newStatus === 'active' ? 'activated' : 'paused'}` });
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleEdit = (recurring: RecurringInvoice) => {
    setSelectedRecurring(recurring);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedRecurring(null);
    setModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "weekly": return "Weekly";
      case "biweekly": return "Every 2 Weeks";
      case "monthly": return "Monthly";
      case "quarterly": return "Quarterly";
      case "yearly": return "Yearly";
      default: return frequency;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "completed":
        return <Badge className="bg-accent/10 text-accent border-accent/20">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredInvoices = recurringInvoices.filter((invoice) => {
    const matchesSearch = 
      invoice.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: recurringInvoices.length,
    active: recurringInvoices.filter(r => r.status === 'active').length,
    paused: recurringInvoices.filter(r => r.status === 'paused').length,
    totalRevenue: recurringInvoices
      .filter(r => r.status === 'active')
      .reduce((sum, r) => sum + (r.total || 0), 0),
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader title="Recurring Invoices" subtitle="Automate your billing with scheduled invoices" />
          <main className="p-6">
            <ApiErrorFallback
              error={error instanceof Error ? error : null}
              onRetry={() => refetch()}
              title="Failed to load recurring invoices"
              description="There was a problem fetching your recurring invoices."
            />
          </main>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader title="Recurring Invoices" subtitle="Automate your billing with scheduled invoices" />
          <main className="p-6">
            <PageLoadingSpinner message="Loading recurring invoices..." />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Recurring Invoices" subtitle="Automate your billing with scheduled invoices" />

        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Recurring", value: stats.total, icon: RefreshCw, color: "text-accent" },
              { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-success" },
              { label: "Paused", value: stats.paused, icon: Pause, color: "text-warning" },
              { label: "Monthly Revenue", value: formatCurrency(stats.totalRevenue), icon: Calendar, color: "text-accent", isRevenue: true },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className={`${stat.isRevenue ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>
                        {stat.value}
                      </p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search recurring invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="accent" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New Recurring Invoice
            </Button>
          </div>

          {/* Recurring Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recurring Invoices</CardTitle>
              <CardDescription>Manage your automated billing schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Client</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Description</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Frequency</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Next Invoice</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          {searchQuery || statusFilter !== "all" 
                            ? "No recurring invoices found matching your criteria." 
                            : "No recurring invoices yet. Create your first one!"}
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium text-foreground">{invoice.client_name}</td>
                          <td className="p-3 text-muted-foreground max-w-[200px] truncate">{invoice.description}</td>
                          <td className="p-3 font-medium text-foreground">{formatCurrency(invoice.total)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-foreground">{getFrequencyLabel(invoice.frequency)}</span>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {invoice.next_invoice_date 
                              ? format(parseISO(invoice.next_invoice_date), 'PPP')
                              : 'N/A'}
                          </td>
                          <td className="p-3">{getStatusBadge(invoice.status)}</td>
                          <td className="p-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(invoice.id, invoice.status)}>
                                  {invoice.status === 'active' ? (
                                    <>
                                      <Pause className="w-4 h-4 mr-2" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(invoice.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <RecurringInvoiceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        recurringInvoice={selectedRecurring}
      />
    </div>
  );
};

export default RecurringInvoices;