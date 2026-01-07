import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { useSendSms } from "@/hooks/useSendSms";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Invoice } from "@/lib/types";

interface SendSmsDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendSmsDialog({ invoice, open, onOpenChange }: SendSmsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const sendSms = useSendSms();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const defaultMessage = `Reminder: Invoice #${invoice.id} for ${formatCurrency(invoice.total)} is ${invoice.status.toLowerCase()}. Please settle at your earliest convenience. Contact us for queries.`;
  
  const [message, setMessage] = useState(defaultMessage);

  const isPlanAllowed = user?.plan === 'pro' || user?.plan === 'business';

  const handleSend = async () => {
    try {
      const result = await sendSms.mutateAsync({ 
        invoiceId: invoice.id, 
        message 
      });
      
      toast({
        title: "SMS Sent",
        description: result.message || "Reminder sent successfully to client.",
      });
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send SMS";
      toast({
        title: "SMS Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send SMS Reminder
          </DialogTitle>
          <DialogDescription>
            Send an SMS reminder to {invoice.clientName} for Invoice #{invoice.id}
          </DialogDescription>
        </DialogHeader>

        {!isPlanAllowed ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertCircle className="w-12 h-12 text-warning" />
            <div className="text-center">
              <p className="font-medium text-foreground">Upgrade Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                SMS reminders are available on Pro and Business plans.
              </p>
            </div>
            <Button variant="accent" onClick={() => onOpenChange(false)}>
              Upgrade to Pro
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter SMS message..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/500 characters
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={sendSms.isPending || !message.trim()}
              >
                {sendSms.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send SMS
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
