import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, File } from "@/lib/icons";

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
        
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
