import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreatePayment } from "@/hooks/usePayments";
import { useInvoices } from "@/hooks/useInvoices";
import { Loader2 } from "lucide-react";

const paymentSchema = z.object({
  invoice_id: z.string().min(1, "Invoice is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.string().min(1, "Payment method is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(500).optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethods = [
  { value: "Bank Transfer", label: "Bank Transfer (EFT)" },
  { value: "Credit Card", label: "Credit Card" },
  { value: "Cash", label: "Cash" },
  { value: "PayPal", label: "PayPal" },
  { value: "Mobile Payment", label: "Mobile Payment" },
  { value: "Other", label: "Other" },
];

export function PaymentModal({ open, onOpenChange }: PaymentModalProps) {
  const { toast } = useToast();
  const createPayment = useCreatePayment();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();

  // Filter unpaid invoices
  const unpaidInvoices = invoices.filter(
    (inv) => inv.status !== "Paid"
  );

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: "",
      amount: 0,
      method: "Bank Transfer",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        invoice_id: "",
        amount: 0,
        method: "Bank Transfer",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      await createPayment.mutateAsync({
        invoice_id: data.invoice_id,
        amount: data.amount,
        method: data.method,
        date: data.date,
        notes: data.notes,
      });
      toast({ title: "Payment recorded successfully" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to record payment",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="invoice_id">Invoice *</Label>
            <Controller
              name="invoice_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={invoicesLoading ? "Loading..." : "Select invoice"} />
                  </SelectTrigger>
                  <SelectContent>
                  {unpaidInvoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={String(invoice.id)}>
                        {invoice.id} - {invoice.clientName} ({formatCurrency(invoice.total)})
                      </SelectItem>
                    ))}
                    {unpaidInvoices.length === 0 && !invoicesLoading && (
                      <SelectItem value="none" disabled>
                        No unpaid invoices
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.invoice_id && <p className="text-sm text-destructive mt-1">{errors.invoice_id.message}</p>}
          </div>

          <div>
            <Label htmlFor="amount">Amount (R) *</Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <Label htmlFor="method">Payment Method *</Label>
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.method && <p className="text-sm text-destructive mt-1">{errors.method.message}</p>}
          </div>

          <div>
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Payment reference or notes" rows={2} />
            {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
