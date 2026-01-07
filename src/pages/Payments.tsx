import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { paymentService, invoiceService } from "@/lib/mockData";
import { Payment, Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  CreditCard,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Payments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<Payment[]>(() =>
    user ? paymentService.getAll(user.id) : []
  );
  const [invoices] = useState<Invoice[]>(() =>
    user ? invoiceService.getAll(user.id).filter(i => i.status !== "Paid") : []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: "",
    amount: "",
    method: "Bank Transfer" as Payment["method"],
    date: new Date().toISOString().split("T")[0],
  });

  const refreshPayments = () => {
    if (user) setPayments(paymentService.getAll(user.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const invoice = invoiceService.getById(formData.invoiceId);
    if (!invoice) return;

    paymentService.create({
      userId: user.id,
      invoiceId: formData.invoiceId,
      invoiceNumber: invoice.id,
      clientName: invoice.clientName,
      amount: parseFloat(formData.amount),
      method: formData.method,
      date: formData.date,
    });

    // Mark invoice as paid if amount matches
    if (parseFloat(formData.amount) >= invoice.total) {
      invoiceService.update(invoice.id, { status: "Paid" });
    }

    toast({ title: "Payment recorded successfully" });
    refreshPayments();
    setIsModalOpen(false);
    setFormData({ invoiceId: "", amount: "", method: "Bank Transfer", date: new Date().toISOString().split("T")[0] });
  };

  const handleDelete = (id: string) => {
    paymentService.delete(id);
    toast({ title: "Payment deleted" });
    refreshPayments();
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Payments" subtitle="Track and record payments" />

        <main className="p-6">
          {/* Summary */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalReceived)}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Payments Recorded</p>
              <p className="text-2xl font-bold text-foreground">{payments.length}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Pending Invoices</p>
              <p className="text-2xl font-bold text-warning">{invoices.length}</p>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="accent" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Record Payment
            </Button>
          </div>

          {/* Payments Table */}
          <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Invoice</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Method</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-success" />
                          </div>
                          <span className="font-medium text-foreground">{payment.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="p-4 text-foreground">{payment.clientName}</td>
                      <td className="p-4 font-medium text-success">{formatCurrency(payment.amount)}</td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{payment.method}</td>
                      <td className="p-4 text-muted-foreground hidden lg:table-cell">{payment.date}</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDelete(payment.id)} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No payments recorded</h3>
                <p className="text-muted-foreground mb-4">Record your first payment to get started</p>
                <Button variant="accent" onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Record Payment
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Record Payment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="invoice">Invoice</Label>
              <Select value={formData.invoiceId} onValueChange={(v) => setFormData({ ...formData, invoiceId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.id} - {invoice.clientName} ({formatCurrency(invoice.total)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount (R)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="method">Payment Method</Label>
              <Select value={formData.method} onValueChange={(v: Payment["method"]) => setFormData({ ...formData, method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
