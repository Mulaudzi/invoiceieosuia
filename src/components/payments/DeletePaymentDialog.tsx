import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeletePayment } from "@/hooks/usePayments";
import { useToast } from "@/hooks/use-toast";
import { Payment } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface DeletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
}

export function DeletePaymentDialog({ open, onOpenChange, payment }: DeletePaymentDialogProps) {
  const { toast } = useToast();
  const deletePayment = useDeletePayment();

  const handleDelete = async () => {
    if (!payment) return;
    
    try {
      await deletePayment.mutateAsync(payment.id);
      toast({ title: "Payment deleted successfully" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to delete payment",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Payment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this payment of <strong>{payment ? formatCurrency(payment.amount) : ""}</strong>?
            This action cannot be undone and may affect invoice status.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deletePayment.isPending}
          >
            {deletePayment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
