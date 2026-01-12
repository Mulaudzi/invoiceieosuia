import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isFreePlan } from "@/lib/exportUtils";

interface ExportDropdownProps {
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  onExportText?: () => void;
  label?: string;
  disabled?: boolean;
}

export const ExportDropdown = ({
  onExportCsv,
  onExportPdf,
  onExportText,
  label = "Export",
  disabled = false,
}: ExportDropdownProps) => {
  const { user } = useAuth();
  const isFree = isFreePlan(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Download className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {onExportCsv && (
          <DropdownMenuItem onClick={onExportCsv}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
        )}
        
        {onExportPdf && (
          <DropdownMenuItem onClick={onExportPdf}>
            <FileText className="w-4 h-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        )}
        
        {onExportText && (
          <DropdownMenuItem onClick={onExportText}>
            <File className="w-4 h-4 mr-2" />
            Export as Text Report
          </DropdownMenuItem>
        )}
        
        {isFree && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground">
                Free plan exports include IEOSUIA branding.{' '}
                <a href="/dashboard/subscription" className="text-accent hover:underline">
                  Upgrade
                </a>{' '}
                to remove.
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
