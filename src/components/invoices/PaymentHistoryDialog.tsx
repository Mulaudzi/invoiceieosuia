import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Invoice, InvoicePayment } from '@/lib/types';
import { useUpdateInvoicePayment, useVoidInvoicePayment } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/use-toast';

export function PaymentHistoryDialog({ invoice, open, onOpenChange }: { invoice: Invoice | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [editing, setEditing] = useState<InvoicePayment | null>(null);
  const [amount, setAmount] = useState(''); const [date, setDate] = useState(''); const [reference, setReference] = useState('');
  const updatePayment = useUpdateInvoicePayment(); const voidPayment = useVoidInvoicePayment(); const { toast } = useToast();
  useEffect(() => { if (editing) { setAmount(String(editing.amount)); setDate(editing.paymentDate); setReference(editing.reference || ''); } }, [editing]);
  if (!invoice) return null;
  const save = async () => { if (!editing || !window.confirm('Save these changes to the recorded payment? The outstanding balance will be recalculated.')) return; try { await updatePayment.mutateAsync({ id: invoice.id, paymentId: editing.id, amount: Number(amount), paymentDate: date, reference }); setEditing(null); toast({ title: 'Payment updated' }); } catch (error) { toast({ title: error instanceof Error ? error.message : 'Could not update payment', variant: 'destructive' }); } };
  const remove = async (payment: InvoicePayment) => { if (!window.confirm(`Void the payment of R ${payment.amount.toFixed(2)} recorded on ${payment.paymentDate}? This cannot be undone and the balance will be recalculated.`)) return; try { await voidPayment.mutateAsync({ id: invoice.id, paymentId: payment.id }); toast({ title: 'Payment voided and balance recalculated' }); } catch (error) { toast({ title: error instanceof Error ? error.message : 'Could not void payment', variant: 'destructive' }); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Payment History — {invoice.invoiceNumber}</DialogTitle></DialogHeader>
    <div className="space-y-3 max-h-[55vh] overflow-y-auto">{invoice.paymentHistory.length === 0 ? <p className="text-sm text-muted-foreground">No payments recorded.</p> : invoice.paymentHistory.map(payment => <div key={payment.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><p className={payment.voidedAt ? 'line-through text-muted-foreground' : 'font-medium'}>R {payment.amount.toFixed(2)}</p><p className="text-sm text-muted-foreground">{payment.paymentDate}{payment.reference ? ` · ${payment.reference}` : ''}</p>{payment.voidedAt && <p className="text-xs text-destructive">Voided</p>}</div>{!payment.voidedAt && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(payment)}>Edit</Button><Button size="sm" variant="destructive" onClick={() => remove(payment)}>Void</Button></div>}</div>)}</div>
    <div className="rounded-lg bg-muted p-3 text-sm"><span>Paid: R {invoice.amountPaid.toFixed(2)}</span><span className="float-right font-semibold">Outstanding: R {invoice.balanceDue.toFixed(2)}</span></div>
    {editing && <div className="space-y-3 border-t pt-4"><p className="font-medium">Edit payment</p><div><Label>Amount</Label><Input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></div><div><Label>Payment date</Label><Input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div><div><Label>Reference</Label><Input value={reference} onChange={e=>setReference(e.target.value)}/></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setEditing(null)}>Cancel</Button><Button onClick={save} disabled={updatePayment.isPending}>Save changes</Button></div></div>}
  </DialogContent></Dialog>;
}
