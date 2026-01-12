import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useScheduleReminders } from "@/hooks/useReminders";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface ScheduleReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  invoiceNumber: string;
  dueDate: string;
}

export function ScheduleReminderDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  dueDate,
}: ScheduleReminderDialogProps) {
  const { toast } = useToast();
  const scheduleReminders = useScheduleReminders();
  
  const [beforeDue, setBeforeDue] = useState(true);
  const [beforeDueDays, setBeforeDueDays] = useState("3");
  const [onDue, setOnDue] = useState(true);
  const [afterDue, setAfterDue] = useState(true);
  const [afterDueDays, setAfterDueDays] = useState("7");

  const handleSchedule = async () => {
    const reminders: Array<{ type: string; days: number }> = [];
    
    if (beforeDue) {
      reminders.push({ type: 'before_due', days: parseInt(beforeDueDays) });
    }
    if (onDue) {
      reminders.push({ type: 'on_due', days: 0 });
    }
    if (afterDue) {
      reminders.push({ type: 'after_due', days: parseInt(afterDueDays) });
    }
    
    if (reminders.length === 0) {
      toast({
        title: "No reminders selected",
        description: "Please select at least one reminder type",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await scheduleReminders.mutateAsync({ invoiceId, reminders });
      toast({
        title: "Reminders scheduled",
        description: `${result.reminders?.length || 0} reminder(s) have been scheduled`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to schedule reminders",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const dueDateObj = new Date(dueDate);
  
  const getScheduledDate = (type: string, days: number): Date => {
    const date = new Date(dueDateObj);
    if (type === 'before_due') {
      date.setDate(date.getDate() - days);
    } else if (type === 'after_due') {
      date.setDate(date.getDate() + days);
    }
    return date;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Schedule Payment Reminders
          </DialogTitle>
          <DialogDescription>
            Set up automatic email reminders for invoice {invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="text-muted-foreground">Due date:</span>{" "}
              <strong>{format(dueDateObj, "PPP")}</strong>
            </span>
          </div>

          {/* Before Due Date */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={beforeDue}
                  onCheckedChange={(checked) => setBeforeDue(!!checked)}
                />
                Before due date
              </Label>
            </div>
            {beforeDue && (
              <div className="ml-6 flex items-center gap-2">
                <Select value={beforeDueDays} onValueChange={setBeforeDueDays}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">before</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(getScheduledDate('before_due', parseInt(beforeDueDays)), "MMM d")}
                </span>
              </div>
            )}
          </div>

          {/* On Due Date */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={onDue}
                onCheckedChange={(checked) => setOnDue(!!checked)}
              />
              On due date
            </Label>
            <span className="text-xs text-muted-foreground">
              {format(dueDateObj, "MMM d")}
            </span>
          </div>

          {/* After Due Date */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={afterDue}
                  onCheckedChange={(checked) => setAfterDue(!!checked)}
                />
                After due date (overdue)
              </Label>
            </div>
            {afterDue && (
              <div className="ml-6 flex items-center gap-2">
                <Select value={afterDueDays} onValueChange={setAfterDueDays}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">after</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(getScheduledDate('after_due', parseInt(afterDueDays)), "MMM d")}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg text-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700 dark:text-amber-400">
              Reminders will be sent at 9:00 AM on scheduled dates
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={handleSchedule}
            disabled={scheduleReminders.isPending}
          >
            {scheduleReminders.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Schedule Reminders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
