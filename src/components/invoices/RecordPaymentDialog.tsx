import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRecordInvoicePayment } from "@/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";

type PaymentInvoice = { id: string | number; total: number; amountPaid?: number; balanceDue?: number; label?: string };

export function RecordPaymentDialog({ invoice, open, onOpenChange, onRecorded }: { invoice: PaymentInvoice | null; open: boolean; onOpenChange: (open: boolean) => void; onRecorded?: () => void }) {
  const balance = Number(invoice?.balanceDue ?? invoice?.total ?? 0);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [requestId, setRequestId] = useState("");
  const recordPayment = useRecordInvoicePayment();
  const { toast } = useToast();
  useEffect(() => { if (open) { setAmount(balance.toFixed(2)); setPaymentDate(new Date().toISOString().slice(0, 10)); setReference(""); setRequestId(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`); } }, [open, balance]);
  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > balance + 0.005) { toast({ title: "Enter a payment within the outstanding balance", variant: "destructive" }); return; }
    try { await recordPayment.mutateAsync({ id: invoice!.id, amount: value, paymentDate, reference, requestId }); toast({ title: value < balance ? "Partial payment recorded" : "Invoice paid in full" }); onOpenChange(false); onRecorded?.(); }
    catch (error) { toast({ title: "Payment was not recorded", description: error instanceof Error ? error.message : "Please review the payment details and try again.", variant: "destructive" }); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>{invoice?.label || "Invoice"} — outstanding balance R {balance.toFixed(2)}</DialogDescription></DialogHeader><div className="space-y-4"><label className="block text-sm font-medium">Amount<Input type="number" min="0.01" step="0.01" max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} /></label><label className="block text-sm font-medium">Payment date<Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /></label><label className="block text-sm font-medium">Reference (optional)<Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="EFT reference, receipt number…" /></label></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} disabled={recordPayment.isPending}>Record Payment</Button></DialogFooter></DialogContent></Dialog>;
}
