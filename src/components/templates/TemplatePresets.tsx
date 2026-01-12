import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { templatePresets, TemplatePreset } from "@/lib/templatePresets";
import { useCreateTemplate } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";

interface TemplatePresetsProps {
  onTemplateCreated?: () => void;
}

export function TemplatePresets({ onTemplateCreated }: TemplatePresetsProps) {
  const { toast } = useToast();
  const createTemplate = useCreateTemplate();
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const handleUsePreset = async (preset: TemplatePreset) => {
    setCreatingId(preset.id);
    try {
      await createTemplate.mutateAsync({
        name: preset.name,
        description: preset.description,
        styles: preset.styles,
        isDefault: false,
      });
      toast({ title: `"${preset.name}" template created successfully` });
      onTemplateCreated?.();
    } catch (error) {
      toast({
        title: "Failed to create template",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Template Presets</h3>
        <p className="text-sm text-muted-foreground">
          Choose from our professionally designed templates to get started quickly
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templatePresets.map((preset) => (
          <Card key={preset.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              {/* Color Preview */}
              <div className="flex gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                  style={{ backgroundColor: preset.styles.primaryColor }}
                  title="Primary Color"
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                  style={{ backgroundColor: preset.styles.accentColor }}
                  title="Accent Color"
                />
              </div>
              <CardTitle className="text-base">{preset.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {preset.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Mini Preview */}
              <div 
                className="mb-3 p-3 rounded-md border text-[8px] bg-white text-gray-900"
                style={{ borderColor: preset.styles.primaryColor }}
              >
                <div 
                  className="font-bold mb-1"
                  style={{ color: preset.styles.primaryColor }}
                >
                  Sample Invoice
                </div>
                <div className="flex justify-between text-[6px] text-gray-500">
                  <span>Item</span>
                  <span>R1,000.00</span>
                </div>
                <div 
                  className="mt-1 pt-1 border-t text-right font-bold text-[7px]"
                  style={{ 
                    borderColor: preset.styles.primaryColor,
                    color: preset.styles.primaryColor 
                  }}
                >
                  Total: R1,150.00
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleUsePreset(preset)}
                disabled={creatingId === preset.id}
              >
                {creatingId === preset.id ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3 mr-1" />
                )}
                Use This Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
