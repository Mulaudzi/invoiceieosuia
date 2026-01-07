import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

const StatCard = ({ title, value, change, changeType = "neutral", icon: Icon }: StatCardProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-soft card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        {change && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
              changeType === "positive" && "bg-success/10 text-success",
              changeType === "negative" && "bg-destructive/10 text-destructive",
              changeType === "neutral" && "bg-muted text-muted-foreground"
            )}
          >
            {changeType === "positive" && <TrendingUp className="w-3 h-3" />}
            {changeType === "negative" && <TrendingDown className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
};

export default StatCard;
