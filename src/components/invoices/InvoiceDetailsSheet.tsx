import { useEffect, useState } from "react";
import { Invoice } from "@/lib/types";
import { invoiceService } from "@/services/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, Edit, Eye, Printer } from "@/lib/icons";
import { getDocumentTitle } from "@/lib/invoiceArchitecture";
import { formatDateSafe } from "@/lib/dateUtils";

const money = (value: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function InvoiceDetailsSheet({ invoice, open, onOpenChange, onEdit, onManagePayments }: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (invoice: Invoice) => void;
  onManagePayments: (invoice: Invoice) => void;
}) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    if (!open || !invoice) return;
    let active = true;
    let objectUrl = "";
    setPreviewError("");
    invoiceService.getPdfBlob(invoice.id).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
    }).catch(() => active && setPreviewError("The invoice preview could not be loaded. You can still download the PDF."));
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); setPdfUrl(""); setShowPreview(false); };
  }, [open, invoice?.id]);

  if (!invoice) return null;
  const activePayments = invoice.paymentHistory.filter((payment) => !payment.voidedAt);
  const relatedNotes = (invoice.linkedDocuments || []).filter((document) => ['credit_note', 'debit_note'].includes(document.documentType));
  const download = async () => invoiceService.downloadPdf(invoice.id);
  const print = () => { if (pdfUrl) window.open(pdfUrl, "_blank"); };
  const viewRelatedDocument = async (id: string) => {
    const blob = await invoiceService.getPdfBlob(id);
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank");
    if (!opened) URL.revokeObjectURL(url); else setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="!w-full !max-w-2xl overflow-y-auto p-4 sm:p-6">
      <SheetHeader className="pr-8">
        <SheetTitle>{getDocumentTitle(invoice.documentType || "standard_invoice")} {invoice.invoiceNumber}</SheetTitle>
        <SheetDescription>{invoice.clientName} · {invoice.status}</SheetDescription>
      </SheetHeader>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setShowPreview((value) => !value)} disabled={!pdfUrl}><Eye className="mr-2 h-4 w-4" />{showPreview ? "Hide preview" : "Preview invoice"}</Button>
        <Button size="sm" variant="outline" onClick={download}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
        <Button size="sm" variant="outline" onClick={print} disabled={!pdfUrl}><Printer className="mr-2 h-4 w-4" />Print</Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(invoice)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
      </div>

      {previewError && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{previewError}</p>}
      {showPreview && pdfUrl && <iframe title={`Preview ${invoice.invoiceNumber}`} src={pdfUrl} className="mt-4 h-[65vh] w-full rounded-lg border bg-white" />}

      <section className="mt-6 grid grid-cols-2 gap-3 rounded-xl border p-4 text-sm sm:grid-cols-3">
        {invoice.metadata?.original_invoice_number && <div className="col-span-2 sm:col-span-3"><span className="text-muted-foreground">Original invoice</span><strong className="block">{String(invoice.metadata.original_invoice_number)}</strong></div>}
        <div><span className="text-muted-foreground">Invoice date</span><strong className="block">{formatDateSafe(invoice.date, "dd MMM yyyy")}</strong></div>
        <div><span className="text-muted-foreground">Due date</span><strong className="block">{formatDateSafe(invoice.dueDate, "dd MMM yyyy")}</strong></div>
        <div><span className="text-muted-foreground">Status</span><strong className="block">{invoice.status}</strong></div>
        {(invoice.creditTotal || 0) > 0 && <div><span className="text-muted-foreground">Credits applied</span><strong className="block text-success">−{money(invoice.creditTotal || 0)}</strong></div>}
        {(invoice.debitTotal || 0) > 0 && <div><span className="text-muted-foreground">Debits applied</span><strong className="block">+{money(invoice.debitTotal || 0)}</strong></div>}
        <div><span className="text-muted-foreground">Total</span><strong className="block">{money(invoice.total)}</strong></div>
        <div><span className="text-muted-foreground">Paid</span><strong className="block text-success">{money(invoice.amountPaid)}</strong></div>
        <div><span className="text-muted-foreground">Outstanding</span><strong className="block text-destructive">{money(invoice.balanceDue)}</strong></div>
      </section>

      {relatedNotes.length > 0 && <section className="mt-6"><h3 className="font-semibold">Related Documents / Credit &amp; Debit Notes</h3><p className="mb-3 text-sm text-muted-foreground">Paid or applied notes are included automatically in the recalculated invoice and client balances.</p><div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[620px] text-sm"><thead className="bg-muted/40 text-left"><tr><th className="p-3">Document type</th><th className="p-3">Number</th><th className="p-3">Date created</th><th className="p-3 text-right">Amount</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr></thead><tbody>{relatedNotes.map(document => <tr key={document.id} className="border-t"><td className="p-3">{getDocumentTitle(document.documentType)}</td><td className="p-3 font-medium">{document.invoiceNumber}</td><td className="p-3">{formatDateSafe(document.date, "dd MMM yyyy")}</td><td className={`p-3 text-right font-medium ${document.documentType === 'credit_note' ? 'text-success' : ''}`}>{document.documentType === 'credit_note' ? '−' : '+'}{money(document.total)}</td><td className="p-3">{document.status}</td><td className="p-3 text-right"><Button size="sm" variant="outline" onClick={() => viewRelatedDocument(document.id)}><Eye className="mr-2 h-4 w-4" />View</Button></td></tr>)}</tbody></table></div></section>}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div><h3 className="font-semibold">Payment history</h3><p className="text-sm text-muted-foreground">All recorded payments and payment dates.</p></div>
          <Button size="sm" variant="outline" onClick={() => onManagePayments(invoice)}><CreditCard className="mr-2 h-4 w-4" />Manage</Button>
        </div>
        {invoice.paymentHistory.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No payments recorded.</p> :
          <div className="space-y-2">{invoice.paymentHistory.map((payment) => <div key={payment.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><strong className={payment.voidedAt ? "line-through text-muted-foreground" : ""}>{money(payment.amount)}</strong><p className="text-muted-foreground">{formatDateSafe(payment.paymentDate, "dd MMM yyyy")}{payment.reference ? ` · ${payment.reference}` : ""}</p></div><span className={payment.voidedAt ? "text-destructive" : "text-success"}>{payment.voidedAt ? "Voided" : "Recorded"}</span></div>)}</div>}
        {activePayments.length > 1 && <p className="mt-2 text-xs text-muted-foreground">This invoice has {activePayments.length} active payments.</p>}
      </section>
    </SheetContent>
  </Sheet>;
}
