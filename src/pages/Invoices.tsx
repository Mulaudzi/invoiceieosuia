import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  Trash2,
  Download,
  CheckCircle,
  CreditCard,
  Printer,
  Send,
  FileText,
} from "@/lib/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useInvoices, useDeleteInvoice, useDownloadInvoicePdf, useMarkInvoicePaid, useIssueInvoice } from "@/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { ApiErrorFallback } from "@/components/ApiErrorFallback";
import { InvoiceModal } from "@/components/invoices/InvoiceModal";
import { InvoiceStartWizard, type InvoiceStartSelection } from "@/components/invoices/InvoiceStartWizard";
import { DeleteInvoiceDialog } from "@/components/invoices/DeleteInvoiceDialog";
import { Invoice } from "@/lib/types";
import { ExportDropdown } from "@/components/exports/ExportDropdown";
import { useExport } from "@/hooks/useExport";
import { invoiceColumns, formatCurrencyForExport, formatDateForExport } from "@/lib/exportUtils";
import { RecurringInvoice, useRecurringInvoices } from "@/hooks/useRecurringInvoices";
import { getDocumentTitle, getTemplate } from "@/lib/invoiceArchitecture";
import { RecordPaymentDialog } from "@/components/invoices/RecordPaymentDialog";
import { PaymentHistoryDialog } from "@/components/invoices/PaymentHistoryDialog";
import { InvoiceDetailsSheet } from "@/components/invoices/InvoiceDetailsSheet";
import { invoiceService } from "@/services/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const documentFilterOptions = [
  ['standard_invoice', 'Standard Invoice'], ['tax_invoice', 'Tax Invoice'],
  ['pro_forma', 'Pro Forma Invoice'], ['final', 'Final Invoice'],
  ['quote', 'Quote / Estimate'], ['credit_note', 'Credit Note'],
  ['debit_note', 'Debit Note'], ['receipt', 'Receipt'],
] as const;

const statusFilterOptions = [
  { id: 'draft', label: 'Draft', values: ['Draft'] },
  { id: 'pending', label: 'Unpaid / Pending', values: ['Unpaid', 'Pending'] },
  { id: 'partial', label: 'Partially Paid', values: ['Partially Paid'] },
  { id: 'paid', label: 'Paid', values: ['Paid'] },
  { id: 'overdue', label: 'Overdue', values: ['Overdue'] },
  { id: 'cancelled', label: 'Cancelled / Voided', values: ['Cancelled', 'Voided'] },
] as const;

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [startWizardOpen, setStartWizardOpen] = useState(false);
  const [startSelection, setStartSelection] = useState<InvoiceStartSelection>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [pendingSchedule, setPendingSchedule] = useState<RecurringInvoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [historyInvoiceId, setHistoryInvoiceId] = useState<string | null>(null);
  const [detailsInvoiceId, setDetailsInvoiceId] = useState<string | null>(null);
  const [sourceInvoice, setSourceInvoice] = useState<Invoice | null>(null);
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const openedSchedule = useRef<string | null>(null);
  const { toast } = useToast();
  const { exportToCsv, exportToText } = useExport();
  
  // API hooks
  const { data: invoices = [], isLoading, error, refetch } = useInvoices();
  const { data: schedules = [] } = useRecurringInvoices();
  const deleteInvoice = useDeleteInvoice();
  const downloadPdf = useDownloadInvoicePdf();
  const markPaid = useMarkInvoicePaid();
  const issueInvoice = useIssueInvoice();
  const historyInvoice = invoices.find(entry => entry.id === historyInvoiceId) || null;
  const detailsInvoice = invoices.find(entry => entry.id === detailsInvoiceId) || null;

  useEffect(() => {
    const scheduleId = searchParams.get("schedule");
    if (!scheduleId || openedSchedule.current === scheduleId || schedules.length === 0) return;
    const schedule = schedules.find((entry) => String(entry.id) === scheduleId);
    if (!schedule) return;
    openedSchedule.current = scheduleId;
    setPendingSchedule(schedule);
    setSelectedInvoice(null);
    setStartWizardOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("schedule");
    setSearchParams(next, { replace: true });
  }, [schedules, searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get("new") !== "document") return;
    setSelectedInvoice(null);
    setSourceInvoice(null);
    setStartWizardOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleOpenCreateModal = () => {
    setSelectedInvoice(null);
    setSourceInvoice(null);
    setStartWizardOpen(true);
  };

  const handleCreateDocument = (invoice: Invoice, documentType: 'credit_note' | 'debit_note' | 'receipt') => {
    const currentTemplate = getTemplate(invoice.templateSlug);
    setSelectedInvoice(null);
    setSourceInvoice(invoice);
    setStartSelection({ category: invoice.category || 'general', documentType, templateSlug: currentTemplate.supportedDocumentTypes.includes(documentType) ? currentTemplate.slug : 'general-corporate-blue' });
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
      case "Partially Paid":
        return "bg-blue-100 text-blue-700";
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

  const statusFilter = searchParams.get("status");
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || invoice.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedDocumentTypes.length > 0 && !selectedDocumentTypes.includes(invoice.documentType || 'standard_invoice')) return false;
    if (selectedStatuses.length > 0) {
      const matchesSelectedStatus = statusFilterOptions.some(option => selectedStatuses.includes(option.id) && (option.values as readonly string[]).includes(invoice.status));
      if (!matchesSelectedStatus) return false;
    }
    if (statusFilter === "overdue") return invoice.status === "Overdue";
    if (statusFilter === "outstanding") return invoice.status !== "Draft" && invoice.balanceDue > 0;
    return true;
  });
  const activeFilterCount = selectedDocumentTypes.length + selectedStatuses.length + (statusFilter ? 1 : 0);
  const toggleFilter = (value: string, selected: string[], update: (values: string[]) => void) => update(selected.includes(value) ? selected.filter(entry => entry !== value) : [...selected, value]);
  const clearFilters = () => {
    setSelectedDocumentTypes([]);
    setSelectedStatuses([]);
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    setSearchParams(next, { replace: true });
  };

  // Calculate stats from actual data
  const stats = {
    all: invoices.length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    pending: invoices.filter(i => i.status === 'Pending' || i.status === 'Partially Paid').length,
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

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid.mutateAsync(id);
      toast({ title: "Invoice marked as paid" });
    } catch (error) {
      toast({ title: "Failed to mark as paid", variant: "destructive" });
    }
  };

  const handleIssue = async (invoice: Invoice) => { if (!window.confirm(`Issue ${invoice.invoiceNumber}? Once issued it becomes active and payments and due dates will be tracked.`)) return; try { await issueInvoice.mutateAsync(invoice.id); toast({ title: 'Invoice issued' }); } catch (error) { toast({ title: error instanceof Error ? error.message : 'Failed to issue invoice', variant: 'destructive' }); } };
  const handlePrint = async (invoice: Invoice) => { try { const blob = await invoiceService.getPdfBlob(invoice.id); const url = URL.createObjectURL(blob); const opened = window.open(url, '_blank'); if (!opened) throw new Error('Allow pop-ups to print the invoice'); setTimeout(() => URL.revokeObjectURL(url), 60000); } catch (error) { toast({ title: error instanceof Error ? error.message : 'Failed to open PDF', variant: 'destructive' }); } };
  const handleSend = async (invoice: Invoice) => { try { const blob = await invoiceService.getPdfBlob(invoice.id); const file = new File([blob], `${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' }); if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: invoice.invoiceNumber, text: `Please find ${invoice.invoiceNumber} attached.`, files: [file] }); else { await invoiceService.downloadPdf(invoice.id); toast({ title: 'PDF downloaded — attach it to your message' }); } } catch (error) { if ((error as DOMException)?.name !== 'AbortError') toast({ title: 'Could not send invoice', variant: 'destructive' }); } };

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
              <Popover>
                <PopoverTrigger asChild><Button variant="outline"><Filter className="w-4 h-4" />Filters{activeFilterCount > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeFilterCount}</span>}</Button></PopoverTrigger>
                <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)]">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">Filter documents</h3>{activeFilterCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all</Button>}</div>
                  <div className="mt-4"><p className="mb-2 text-sm font-medium">Document Type</p><div className="grid gap-2">{documentFilterOptions.map(([id, label]) => <label key={id} className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={selectedDocumentTypes.includes(id)} onCheckedChange={() => toggleFilter(id, selectedDocumentTypes, setSelectedDocumentTypes)} /><span>{label}</span></label>)}</div></div>
                  <div className="mt-5 border-t pt-4"><p className="mb-2 text-sm font-medium">Status</p><div className="grid gap-2">{statusFilterOptions.map(option => <label key={option.id} className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={selectedStatuses.includes(option.id)} onCheckedChange={() => toggleFilter(option.id, selectedStatuses, setSelectedStatuses)} /><span>{option.label}</span></label>)}</div></div>
                </PopoverContent>
              </Popover>
              <ExportDropdown
                label="Export"
                onExportCsv={() => {
                  const exportData = filteredInvoices.map(inv => ({
                    invoiceNumber: inv.invoiceNumber,
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
                  const exportData = filteredInvoices.map(inv => ({
                    invoiceNumber: inv.invoiceNumber,
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
          {activeFilterCount > 0 && <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3"><p className="text-sm"><strong>Filtered:</strong> showing {filteredInvoices.length} matching document{filteredInvoices.length === 1 ? '' : 's'}</p><Button size="sm" variant="outline" onClick={clearFilters}>Clear filters</Button></div>}
          <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Document</th>
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
                          <span className="font-medium text-foreground block">{getDocumentTitle(invoice.documentType || 'standard_invoice')}</span>
                          <span className="text-xs text-muted-foreground">{invoice.invoiceNumber}</span>
                        </td>
                        <td className="p-4 text-foreground">{invoice.clientName}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{invoice.clientEmail}</td>
                        <td className="p-4 font-medium text-foreground">{formatCurrency(invoice.balanceDue)}{invoice.amountPaid > 0 && <span className="block text-xs text-muted-foreground">of {formatCurrency(invoice.total)}</span>}</td>
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
                              <DropdownMenuItem onClick={() => setDetailsInvoiceId(invoice.id)}>
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
                              <DropdownMenuItem onClick={() => handlePrint(invoice)}><Printer className="w-4 h-4 mr-2" />Print</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSend(invoice)}><Send className="w-4 h-4 mr-2" />Send / Share</DropdownMenuItem>
                              {invoice.status === 'Draft' && <DropdownMenuItem onClick={() => handleIssue(invoice)}><CheckCircle className="w-4 h-4 mr-2" />Finalize / Issue Invoice</DropdownMenuItem>}
                              {invoice.status !== 'Draft' && <DropdownMenuItem onClick={() => setHistoryInvoiceId(invoice.id)}><CreditCard className="w-4 h-4 mr-2" />Payment History</DropdownMenuItem>}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger><FileText className="w-4 h-4 mr-2" />Documents</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem onClick={() => handleCreateDocument(invoice, 'credit_note')}>Credit Note</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCreateDocument(invoice, 'debit_note')}>Debit Note</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCreateDocument(invoice, 'receipt')}>Receipt</DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              {invoice.status !== 'Paid' && invoice.status !== 'Draft' && (
                                <DropdownMenuItem onClick={() => setPaymentInvoice(invoice)}>
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Record Payment
                                </DropdownMenuItem>
                              )}
                              {invoice.status !== 'Paid' && invoice.status !== 'Draft' && (
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

      {/* Invoice Create/Edit Modal */}
      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={(open) => {
          setInvoiceModalOpen(open);
          if (!open) { setPendingSchedule(null); setSourceInvoice(null); }
        }}
        invoice={selectedInvoice}
        selection={startSelection}
        schedule={pendingSchedule}
        sourceInvoice={sourceInvoice}
      />
      <InvoiceStartWizard
        open={startWizardOpen}
        onOpenChange={(open) => {
          setStartWizardOpen(open);
          if (!open && !invoiceModalOpen) setPendingSchedule(null);
        }}
        onContinue={(selection) => {
          setStartSelection(selection);
          setStartWizardOpen(false);
          setInvoiceModalOpen(true);
        }}
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
      <RecordPaymentDialog invoice={paymentInvoice ? { id: paymentInvoice.id, total: paymentInvoice.total, amountPaid: paymentInvoice.amountPaid, balanceDue: paymentInvoice.balanceDue, label: `${getDocumentTitle(paymentInvoice.documentType || 'standard_invoice')} ${paymentInvoice.invoiceNumber}` } : null} open={!!paymentInvoice} onOpenChange={(open) => !open && setPaymentInvoice(null)} />
      <PaymentHistoryDialog invoice={historyInvoice} open={!!historyInvoice} onOpenChange={(open) => !open && setHistoryInvoiceId(null)} />
      <InvoiceDetailsSheet invoice={detailsInvoice} open={!!detailsInvoice} onOpenChange={(open) => !open && setDetailsInvoiceId(null)} onEdit={(entry) => { setDetailsInvoiceId(null); handleOpenEditModal(entry); }} onManagePayments={(entry) => { setDetailsInvoiceId(null); setHistoryInvoiceId(entry.id); }} />
    </div>
  );
};

export default Invoices;
