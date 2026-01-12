import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReminders, useDeleteReminder, Reminder } from "@/hooks/useReminders";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { ApiErrorFallback } from "@/components/ApiErrorFallback";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, isAfter, isBefore, isToday } from "date-fns";

const Reminders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  
  const { data: reminders = [], isLoading, error, refetch } = useReminders();
  const deleteReminder = useDeleteReminder();

  const handleDelete = async (id: number) => {
    try {
      await deleteReminder.mutateAsync(id);
      toast({ title: "Reminder cancelled successfully" });
    } catch (error) {
      toast({ title: "Failed to cancel reminder", variant: "destructive" });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Sent</Badge>;
      case "pending":
        return <Badge variant="default" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case "before_due":
        return "Before Due Date";
      case "on_due":
        return "On Due Date";
      case "after_due":
        return "After Due Date";
      default:
        return type;
    }
  };

  const getTimeUntil = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    
    if (isToday(date)) {
      return "Today";
    }
    
    if (isBefore(date, now)) {
      return "Overdue";
    }
    
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`;
    return `In ${Math.floor(diffDays / 30)} months`;
  };

  const filteredReminders = reminders.filter((reminder) => {
    const matchesSearch = 
      reminder.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || reminder.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    sent: reminders.filter(r => r.status === 'sent').length,
    failed: reminders.filter(r => r.status === 'failed').length,
  };

  // Group reminders by date
  const upcomingReminders = filteredReminders.filter(r => 
    r.status === 'pending' && isAfter(parseISO(r.scheduled_for), new Date())
  );
  const pastReminders = filteredReminders.filter(r => 
    r.status !== 'pending' || isBefore(parseISO(r.scheduled_for), new Date())
  );

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader title="Reminders" subtitle="View and manage scheduled payment reminders" />
          <main className="p-6">
            <ApiErrorFallback
              error={error instanceof Error ? error : null}
              onRetry={() => refetch()}
              title="Failed to load reminders"
              description="There was a problem fetching your reminders. Please try again."
            />
          </main>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader title="Reminders" subtitle="View and manage scheduled payment reminders" />
          <main className="p-6">
            <PageLoadingSpinner message="Loading reminders..." />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Reminders" subtitle="View and manage scheduled payment reminders" />

        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Reminders", value: stats.total, icon: Bell, color: "bg-accent" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "bg-warning" },
              { label: "Sent", value: stats.sent, icon: CheckCircle2, color: "bg-success" },
              { label: "Failed", value: stats.failed, icon: XCircle, color: "bg-destructive" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}/10`}>
                      <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Upcoming Reminders */}
          {upcomingReminders.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Upcoming Reminders
              </h3>
              <div className="grid gap-4">
                {upcomingReminders.map((reminder) => (
                  <Card key={reminder.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-accent/10 rounded-lg">
                            <Mail className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{reminder.invoice_number}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">{reminder.client_name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span>{formatCurrency(reminder.total)}</span>
                              <span>•</span>
                              <span>{getReminderTypeLabel(reminder.reminder_type)}</span>
                              <span>•</span>
                              <span className="text-accent font-medium">{getTimeUntil(reminder.scheduled_for)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(reminder.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(reminder.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel Reminder
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Reminders Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Reminders</CardTitle>
              <CardDescription>Complete history of all scheduled reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Invoice</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Client</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Scheduled For</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReminders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          {searchQuery || statusFilter !== "all" 
                            ? "No reminders found matching your criteria." 
                            : "No reminders scheduled yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredReminders.map((reminder) => (
                        <tr key={reminder.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium text-foreground">{reminder.invoice_number}</td>
                          <td className="p-3 text-foreground">{reminder.client_name}</td>
                          <td className="p-3 text-foreground">{formatCurrency(reminder.total)}</td>
                          <td className="p-3 text-muted-foreground">{getReminderTypeLabel(reminder.reminder_type)}</td>
                          <td className="p-3 text-muted-foreground">
                            {format(parseISO(reminder.scheduled_for), 'PPP')}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(reminder.status)}
                              {getStatusBadge(reminder.status)}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {reminder.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(reminder.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Reminders;