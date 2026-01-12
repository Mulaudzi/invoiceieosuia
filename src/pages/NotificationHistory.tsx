import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useNotificationLogs } from "@/hooks/useCredits";
import {
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NotificationHistory = () => {
  const [filter, setFilter] = useState<'all' | 'email' | 'sms'>('all');
  const { data: logs = [], isLoading, refetch } = useNotificationLogs(filter === 'all' ? undefined : filter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'email' ? (
      <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
        <Mail className="w-5 h-5 text-info" />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
        <MessageSquare className="w-5 h-5 text-accent" />
      </div>
    );
  };

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
    emails: logs.filter(l => l.type === 'email').length,
    sms: logs.filter(l => l.type === 'sms').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader
          title="Notification History"
          subtitle="View all sent emails and SMS with delivery status"
        />

        <main className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Sent</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold text-success">{stats.sent}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Emails</p>
              <p className="text-2xl font-bold text-info">{stats.emails}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">SMS</p>
              <p className="text-2xl font-bold text-accent">{stats.sms}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter:</span>
              </div>
              <Select value={filter} onValueChange={(value: 'all' | 'email' | 'sms') => setFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Emails Only</SelectItem>
                  <SelectItem value="sms">SMS Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Notification List */}
          <div className="bg-card rounded-xl border border-border shadow-soft">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Recent Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Your included monthly credits are free. Additional usage: R0.10/email, R0.23-0.25/SMS
              </p>
            </div>

            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No notifications yet</h3>
                <p className="text-muted-foreground">
                  Sent emails and SMS will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                  >
                    {getTypeIcon(log.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground truncate">
                          {log.recipient}
                        </span>
                        {log.invoice_number && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {log.invoice_number}
                          </span>
                        )}
                      </div>
                      {log.subject && (
                        <p className="text-sm text-muted-foreground truncate mb-1">
                          {log.subject}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {log.credits_used} credit{log.credits_used !== 1 ? 's' : ''}
                      </span>
                      {getStatusBadge(log.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Info */}
          <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-xl">
            <h4 className="font-medium text-foreground mb-2">Credit Pricing</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">
                  <strong>Email:</strong> R0.10 per email (after monthly allocation)
                </p>
                <p className="text-muted-foreground">
                  Monthly credits reset at the start of each billing cycle
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">
                  <strong>SMS Pricing:</strong>
                </p>
                <ul className="text-muted-foreground space-y-0.5">
                  <li>• Solo: R0.25 per SMS</li>
                  <li>• Pro: R0.24 per SMS</li>
                  <li>• Business: R0.23 per SMS</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationHistory;
