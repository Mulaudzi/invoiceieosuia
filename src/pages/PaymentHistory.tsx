import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { ApiErrorFallback } from "@/components/ApiErrorFallback";
import api from "@/services/api";
import {
  Search,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaymentTransaction {
  id: number;
  user_id: number;
  plan: string;
  invoice_id?: number;
  amount: number;
  payment_id?: string;
  merchant_payment_id: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method?: string;
  gateway: string;
  created_at: string;
  completed_at?: string;
  invoice_number?: string;
}

const ITEMS_PER_PAGE = 15;

const usePaymentHistory = (filters: { status?: string; gateway?: string }) => {
  return useQuery({
    queryKey: ['payment-history', filters],
    queryFn: async (): Promise<PaymentTransaction[]> => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.gateway) params.append('gateway', filters.gateway);
      const response = await api.get<{ data: PaymentTransaction[] }>(`/payment-history?${params}`);
      return response.data.data || [];
    },
  });
};

const PaymentHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gatewayFilter, setGatewayFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: transactions = [], isLoading, error, refetch } = usePaymentHistory({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    gateway: gatewayFilter !== 'all' ? gatewayFilter : undefined,
  });

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.merchant_payment_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.plan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getGatewayIcon = (gateway: string) => {
    switch (gateway.toLowerCase()) {
      case 'paystack':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'payfast':
        return <Wallet className="w-4 h-4 text-green-500" />;
      default:
        return <CreditCard className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTransactionType = (plan: string) => {
    if (plan === 'invoice') {
      return { icon: ArrowDownLeft, label: 'Invoice Payment', color: 'text-success' };
    }
    return { icon: ArrowUpRight, label: 'Plan Upgrade', color: 'text-primary' };
  };

  const completedCount = transactions.filter(t => t.status === 'completed').length;
  const pendingCount = transactions.filter(t => t.status === 'pending').length;
  const totalAmount = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const exportTransactions = () => {
    const csv = [
      ['Reference', 'Type', 'Amount', 'Status', 'Gateway', 'Date'].join(','),
      ...filteredTransactions.map(tx => [
        tx.merchant_payment_id,
        tx.plan === 'invoice' ? 'Invoice Payment' : `${tx.plan} Plan`,
        tx.amount,
        tx.status,
        tx.gateway,
        tx.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Payment History" subtitle="View all payment transactions" />

        <main className="p-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-success">{completedCount}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gatewayFilter} onValueChange={(v) => { setGatewayFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Gateway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gateways</SelectItem>
                  <SelectItem value="paystack">Paystack</SelectItem>
                  <SelectItem value="payfast">PayFast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={exportTransactions}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && <PageLoadingSpinner message="Loading payment history..." />}

          {/* Error State */}
          {error && (
            <ApiErrorFallback
              error={error instanceof Error ? error : null}
              onRetry={() => refetch()}
              title="Failed to load payment history"
              description="There was a problem fetching your payment history. Please try again."
            />
          )}

          {/* Transactions Table */}
          {!isLoading && !error && (
            <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reference</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Gateway</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((tx) => {
                      const txType = getTransactionType(tx.plan);
                      const TypeIcon = txType.icon;
                      return (
                        <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${txType.color}`}>
                                <TypeIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-medium text-foreground text-sm block">{tx.merchant_payment_id}</span>
                                {tx.invoice_number && (
                                  <span className="text-xs text-muted-foreground">{tx.invoice_number}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-foreground">
                              {tx.plan === 'invoice' ? 'Invoice Payment' : `${tx.plan.charAt(0).toUpperCase() + tx.plan.slice(1)} Plan`}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-foreground">{formatCurrency(tx.amount)}</td>
                          <td className="p-4 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              {getGatewayIcon(tx.gateway)}
                              <span className="text-muted-foreground capitalize">{tx.gateway}</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground hidden lg:table-cell">{formatDate(tx.created_at)}</td>
                          <td className="p-4">{getStatusBadge(tx.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No transactions found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' || gatewayFilter !== 'all'
                      ? "Try adjusting your filters"
                      : "Payment transactions will appear here"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PaymentHistory;
