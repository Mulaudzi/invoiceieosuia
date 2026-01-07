import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSendInvoice } from "@/hooks/useInvoices";
import { Invoice } from "@/lib/types";
import { Loader2, Mail, FileText, Calendar, DollarSign, User, Send, CheckCircle } from "lucide-react";

interface SendEmailDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendEmailDialog({ invoice, open, onOpenChange }: SendEmailDialogProps) {
  const { toast } = useToast();
  const sendInvoice = useSendInvoice();
  const [message, setMessage] = useState("");
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (open) {
      setMessage("");
      setIsSent(false);
    }
  }, [open]);

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleSend = async () => {
    try {
      await sendInvoice.mutateAsync({
        id: invoice.id,
        message,
      });
      setIsSent(true);
      toast({ title: "Invoice sent successfully!" });
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Failed to send invoice",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (isSent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Invoice Sent!</h3>
            <p className="text-muted-foreground">
              Invoice #{invoice.id} has been sent to {invoice.clientEmail}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Invoice via Email
          </DialogTitle>
          <DialogDescription>
            Preview and send this invoice to your client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Preview Card */}
          <div className="bg-muted/30 rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Invoice #{invoice.id}</p>
                <p className="text-sm text-muted-foreground">PDF will be attached</p>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">To:</span>
                <span className="text-foreground font-medium">{invoice.clientName}</span>
                <span className="text-muted-foreground">({invoice.clientEmail})</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Amount:</span>
                <span className="text-foreground font-semibold">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span className="text-foreground">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note to your client..."
              rows={3}
              className="mt-1"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/1000 characters
            </p>
          </div>

          {/* Email Content Preview */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Email will include:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Professional invoice summary</li>
              <li>• Your custom message (if provided)</li>
              <li>• Invoice PDF attachment</li>
              <li>• Payment details and due date</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleSend} disabled={sendInvoice.isPending}>
            {sendInvoice.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invoice
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
