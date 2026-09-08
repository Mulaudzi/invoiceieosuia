import { useState } from "react";
import { Link } from "react-router-dom";
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
  Bell,
  Eye,
  Download,
  CheckCircle,
  CreditCard,
} from "@/lib/icons";
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
import { useRecurringInvoices, useDeleteRecurringInvoice, useToggleRecurringStatus, RecurringInvoice, type GeneratedRecurringInvoice } from "@/hooks/useRecurringInvoices";
import { useToast } from "@/hooks/use-toast";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { ApiErrorFallback } from "@/components/ApiErrorFallback";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurringInvoiceModal } from "@/components/invoices/RecurringInvoiceModal";
import { formatDateSafe } from "@/lib/dateUtils";
import { useDownloadInvoicePdf, useMarkInvoicePaid } from "@/hooks/useInvoices";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecordPaymentDialog } from "@/components/invoices/RecordPaymentDialog";

const RecurringInvoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringInvoice | null>(null);
  const [ledgerSchedule, setLedgerSchedule] = useState<RecurringInvoice | null>(null);
  const [ledgerMode, setLedgerMode] = useState<"view" | "payments">("view");
  const [paymentEntry, setPaymentEntry] = useState<GeneratedRecurringInvoice | null>(null);
  const { toast } = useToast();
  
  const { data: recurringInvoices = [], isLoading, error, refetch } = useRecurringInvoices();
  const deleteRecurring = useDeleteRecurringInvoice();
  const toggleStatus = useToggleRecurringStatus();
  const downloadPdf = useDownloadInvoicePdf();
  const markPaid = useMarkInvoicePaid();

  const openLedger = (schedule: RecurringInvoice, mode: "view" | "payments") => {
    setLedgerSchedule(schedule);
    setLedgerMode(mode);
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      await downloadPdf.mutateAsync(id);
      toast({ title: "PDF downloaded" });
    } catch {
      toast({ title: "Failed to download PDF", variant: "destructive" });
    }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      await markPaid.mutateAsync(id);
      const refreshed = await refetch();
      setLedgerSchedule((current) => refreshed.data?.find((entry) => entry.id === current?.id) || current);
      toast({ title: "Invoice marked as paid", description: "The payment date was recorded and its reminder was cleared." });
    } catch {
      toast({ title: "Failed to mark invoice as paid", variant: "destructive" });
    }
  };

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

  const handleComplete = async (id: number) => {
    try {
      await toggleStatus.mutateAsync({ id, status: 'completed' });
      toast({ title: "Billing schedule completed" });
    } catch {
      toast({ title: "Failed to complete billing schedule", variant: "destructive" });
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
      .reduce((sum, r) => sum + Number(r.total || 0), 0),
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader title="Billing Schedules" subtitle="Recurring billing reminders and due dates" />
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
          <DashboardHeader title="Billing Schedules" subtitle="Recurring billing reminders and due dates" />
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
        <DashboardHeader title="Billing Schedules" subtitle="Recurring billing reminders and due dates" />

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
              New Billing Schedule
            </Button>
          </div>

          {/* Recurring Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recurring Billing Schedules</CardTitle>
              <CardDescription>Track upcoming billing dates. Invoices are created manually when they become due.</CardDescription>
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
                            : "No billing schedules yet. Create your first one!"}
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
                              ? formatDateSafe(invoice.next_invoice_date, 'PPP')
                              : 'N/A'}
                          </td>
                          <td className="p-3">{getStatusBadge(invoice.status)}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                            <Button asChild type="button" size="sm"><Link to={`/dashboard/invoices?schedule=${invoice.id}`}><Bell className="w-4 h-4 mr-2" />Create Invoice</Link></Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openLedger(invoice, "view")}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openLedger(invoice, "payments")}>
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Payment History
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {!invoice.end_date && invoice.status !== 'completed' && invoice.status !== 'cancelled' && (
                                  <DropdownMenuItem onClick={() => handleComplete(invoice.id)}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />Complete
                                  </DropdownMenuItem>
                                )}
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
                            </div>
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

      <Dialog open={!!ledgerSchedule} onOpenChange={(open) => !open && setLedgerSchedule(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ledgerMode === "payments" ? "Payment History" : "Billing Schedule"}</DialogTitle>
            <DialogDescription>
              {ledgerMode === "payments" ? "Paid invoices and their recorded payment dates." : "Full schedule details and linked invoice history."}
            </DialogDescription>
          </DialogHeader>
          {ledgerSchedule && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg bg-muted/30 p-4 text-sm">
                <div><p className="text-muted-foreground">Client</p><p className="font-medium">{ledgerSchedule.client_name}</p></div>
                <div><p className="text-muted-foreground">Frequency</p><p className="font-medium">{getFrequencyLabel(ledgerSchedule.frequency)}</p></div>
                <div><p className="text-muted-foreground">Next billing date</p><p className="font-medium">{formatDateSafe(ledgerSchedule.next_invoice_date, "PPP")}</p></div>
                <div><p className="text-muted-foreground">Amount</p><p className="font-medium">{formatCurrency(ledgerSchedule.total)}</p></div>
              </div>
              {ledgerMode === "view" && (
                <div className="text-sm space-y-2">
                  <p><span className="text-muted-foreground">Description:</span> {ledgerSchedule.description}</p>
                  <p><span className="text-muted-foreground">Start:</span> {formatDateSafe(ledgerSchedule.start_date, "PPP")} {ledgerSchedule.end_date ? `— End: ${formatDateSafe(ledgerSchedule.end_date, "PPP")}` : "— No end date"}</p>
                  {ledgerSchedule.notes && <p><span className="text-muted-foreground">Notes:</span> {ledgerSchedule.notes}</p>}
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-3">{ledgerMode === "payments" ? "Payments" : "Invoice history"}</h3>
                {(() => {
                  const entries = (ledgerSchedule.generated_invoices || []).filter((entry) => ledgerMode === "view" || Number(entry.amount_paid || 0) > 0);
                  if (entries.length === 0) return <p className="text-sm text-muted-foreground">{ledgerMode === "payments" ? "No payments recorded yet." : "No invoices have been created for this schedule yet."}</p>;
                  return <div className="space-y-2">{entries.map((entry) => (
                    <div key={entry.id} className="flex flex-col md:flex-row md:items-center gap-3 justify-between rounded-lg border p-3">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1 text-sm">
                        <div><p className="text-muted-foreground">Invoice</p><p className="font-medium">{entry.invoice_number}</p></div>
                        <div><p className="text-muted-foreground">Date</p><p>{formatDateSafe(entry.date, "PP")}</p></div>
                        <div><p className="text-muted-foreground">Due</p><p>{formatDateSafe(entry.due_date, "PP")}</p></div>
                        <div><p className="text-muted-foreground">Status</p><p>{entry.status}</p></div>
                        <div><p className="text-muted-foreground">Paid / Balance</p><p>{formatCurrency(Number(entry.amount_paid || 0))} / {formatCurrency(Number(entry.balance_due ?? entry.total))}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(entry.id)} disabled={downloadPdf.isPending}><Download className="w-4 h-4 mr-2" />PDF</Button>
                        {entry.status !== "Paid" && <Button size="sm" onClick={() => handleMarkPaid(entry.id)} disabled={markPaid.isPending}><CheckCircle className="w-4 h-4 mr-2" />Mark Paid</Button>}
                        {entry.status !== "Paid" && <Button variant="outline" size="sm" onClick={() => setPaymentEntry(entry)}><CreditCard className="w-4 h-4 mr-2" />Record Payment</Button>}
                      </div>
                    </div>
                  ))}</div>;
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <RecordPaymentDialog invoice={paymentEntry ? { id: paymentEntry.id, total: Number(paymentEntry.total), amountPaid: Number(paymentEntry.amount_paid || 0), balanceDue: Number(paymentEntry.balance_due ?? paymentEntry.total), label: paymentEntry.invoice_number } : null} open={!!paymentEntry} onOpenChange={(open) => !open && setPaymentEntry(null)} onRecorded={async () => { const refreshed = await refetch(); setLedgerSchedule((current) => refreshed.data?.find((entry) => entry.id === current?.id) || current); }} />
    </div>
  );
};

export default RecurringInvoices;
