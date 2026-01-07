import { Template } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star, MoreHorizontal, Edit, Trash2, Check, FileText } from "lucide-react";

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TemplateCard({ template, onEdit, onSetDefault, onDelete }: TemplateCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-soft card-hover relative overflow-hidden">
      {/* Color Preview Bar */}
      <div
        className="h-2"
        style={{
          background: `linear-gradient(to right, ${template.styles.primaryColor}, ${template.styles.accentColor})`,
        }}
      />

      <div className="p-6">
        {template.isDefault && (
          <div className="absolute top-6 right-4">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Default
            </span>
          </div>
        )}

        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: `${template.styles.primaryColor}20` }}
        >
          <FileText className="w-6 h-6" style={{ color: template.styles.primaryColor }} />
        </div>

        <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

        {/* Style Preview */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-5 h-5 rounded-full border-2 border-background shadow"
            style={{ backgroundColor: template.styles.primaryColor }}
            title="Primary"
          />
          <div
            className="w-5 h-5 rounded-full border-2 border-background shadow"
            style={{ backgroundColor: template.styles.accentColor }}
            title="Accent"
          />
          <span className="text-xs text-muted-foreground capitalize ml-2">
            {template.styles.fontFamily} • {template.styles.headerStyle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          {!template.isDefault && (
            <Button variant="ghost" size="sm" onClick={() => onSetDefault(template.id)}>
              <Check className="w-4 h-4 mr-1" />
              Set Default
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete(template.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
