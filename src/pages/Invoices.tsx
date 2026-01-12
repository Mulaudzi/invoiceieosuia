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
  Download,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInvoices, useDeleteInvoice, useDownloadInvoicePdf, useSendInvoice, useMarkInvoicePaid } from "@/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { ApiErrorFallback } from "@/components/ApiErrorFallback";
import { SendSmsDialog } from "@/components/invoices/SendSmsDialog";
import { SendEmailDialog } from "@/components/invoices/SendEmailDialog";
import { InvoiceModal } from "@/components/invoices/InvoiceModal";
import { DeleteInvoiceDialog } from "@/components/invoices/DeleteInvoiceDialog";
import { Invoice } from "@/lib/types";
import { ExportDropdown } from "@/components/exports/ExportDropdown";
import { useExport } from "@/hooks/useExport";
import { invoiceColumns, formatCurrencyForExport, formatDateForExport } from "@/lib/exportUtils";

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
  const { exportToCsv, exportToText } = useExport();
  
  // API hooks
  const { data: invoices = [], isLoading, error, refetch } = useInvoices();
  const deleteInvoice = useDeleteInvoice();
  const downloadPdf = useDownloadInvoicePdf();
  const sendInvoice = useSendInvoice();
  const markPaid = useMarkInvoicePaid();

  const handleOpenSmsDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSmsDialogOpen(true);
  };

  const handleOpenEmailDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEmailDialogOpen(true);
  };

  const handleOpenCreateModal = () => {
    setSelectedInvoice(null);
    setInvoiceModalOpen(true);
  };

  const handleOpenEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceModalOpen(true);
  };

  const handleOpenDeleteDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedInvoice) return;
    try {
      await deleteInvoice.mutateAsync(selectedInvoice.id);
      toast({ title: "Invoice deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      toast({ title: "Failed to delete invoice", variant: "destructive" });
    }
  };

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats from actual data
  const stats = {
    all: invoices.length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    pending: invoices.filter(i => i.status === 'Pending').length,
    overdue: invoices.filter(i => i.status === 'Overdue').length,
  };


  const handleDownloadPdf = async (id: string) => {
    try {
      await downloadPdf.mutateAsync(id);
      toast({ title: "PDF downloaded" });
    } catch (error) {
      toast({ title: "Failed to download PDF", variant: "destructive" });
    }
  };

  // Email sending is now handled by the SendEmailDialog

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid.mutateAsync(id);
      toast({ title: "Invoice marked as paid" });
    } catch (error) {
      toast({ title: "Failed to mark as paid", variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader title="Invoices" subtitle="Create, manage, and track your invoices" />
          <main className="p-6">
            <ApiErrorFallback
              error={error instanceof Error ? error : null}
              onRetry={() => refetch()}
              title="Failed to load invoices"
              description="There was a problem fetching your invoices. Please try again."
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
          <DashboardHeader title="Invoices" subtitle="Create, manage, and track your invoices" />
          <main className="p-6">
            <PageLoadingSpinner message="Loading invoices..." />
          </main>
        </div>
      </div>
    );
  }

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
              <ExportDropdown
                label="Export"
                onExportCsv={() => {
                  const exportData = invoices.map(inv => ({
                    id: inv.id,
                    clientName: inv.clientName,
                    clientEmail: inv.clientEmail,
                    total: formatCurrencyForExport(inv.total),
                    status: inv.status,
                    date: formatDateForExport(inv.date),
                    dueDate: formatDateForExport(inv.dueDate),
                  }));
                  exportToCsv({
                    title: 'Invoices Export',
                    filename: `invoices-${new Date().toISOString().split('T')[0]}`,
                    columns: invoiceColumns,
                    data: exportData,
                  });
                }}
                onExportText={() => {
                  const exportData = invoices.map(inv => ({
                    id: inv.id,
                    clientName: inv.clientName,
                    clientEmail: inv.clientEmail,
                    total: formatCurrencyForExport(inv.total),
                    status: inv.status,
                    date: formatDateForExport(inv.date),
                    dueDate: formatDateForExport(inv.dueDate),
                  }));
                  exportToText({
                    title: 'Invoices Report',
                    filename: `invoices-${new Date().toISOString().split('T')[0]}`,
                    columns: invoiceColumns,
                    data: exportData,
                  });
                }}
              />
            </div>
            <Button variant="accent" onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "All Invoices", value: stats.all.toString(), color: "bg-foreground" },
              { label: "Paid", value: stats.paid.toString(), color: "bg-success" },
              { label: "Pending", value: stats.pending.toString(), color: "bg-warning" },
              { label: "Overdue", value: stats.overdue.toString(), color: "bg-destructive" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                )}
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
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-4"><Skeleton className="h-5 w-20" /></td>
                        <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-40" /></td>
                        <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-5 w-24" /></td>
                        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-5 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        {searchQuery ? "No invoices found matching your search." : "No invoices yet. Create your first invoice!"}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-4">
                          <span className="font-medium text-foreground">{invoice.id}</span>
                        </td>
                        <td className="p-4 text-foreground">{invoice.clientName}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{invoice.clientEmail}</td>
                        <td className="p-4 font-medium text-foreground">{formatCurrency(invoice.total)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground hidden lg:table-cell">{formatDate(invoice.date)}</td>
                        <td className="p-4 text-muted-foreground hidden lg:table-cell">{formatDate(invoice.dueDate)}</td>
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
                              <DropdownMenuItem onClick={() => handleOpenEditModal(invoice)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(invoice.id)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEmailDialog(invoice)}>
                                <Send className="w-4 h-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenSmsDialog(invoice)}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Send SMS Reminder
                              </DropdownMenuItem>
                              {invoice.status !== 'Paid' && (
                                <DropdownMenuItem onClick={() => handleMarkPaid(invoice.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleOpenDeleteDialog(invoice)}
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

      {/* SMS Dialog */}
      {selectedInvoice && (
        <SendSmsDialog
          invoice={selectedInvoice}
          open={smsDialogOpen}
          onOpenChange={setSmsDialogOpen}
        />
      )}

      {/* Email Dialog */}
      {selectedInvoice && (
        <SendEmailDialog
          invoice={selectedInvoice}
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
        />
      )}

      {/* Invoice Create/Edit Modal */}
      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        invoice={selectedInvoice}
      />

      {/* Delete Confirmation Dialog */}
      {selectedInvoice && (
        <DeleteInvoiceDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          invoiceId={selectedInvoice.id}
          isDeleting={deleteInvoice.isPending}
        />
      )}
    </div>
  );
};

export default Invoices;
