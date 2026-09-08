import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { templatePresets, TemplatePreset } from "@/lib/templatePresets";
import { useCreateTemplate } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "@/lib/icons";
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
        <h3 className="text-lg font-semibold text-foreground">
          Template Designs ({templatePresets.length})
        </h3>
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
                className="mb-3 rounded-md border bg-white text-gray-900 overflow-hidden"
                style={{ borderColor: preset.styles.showBorder ? preset.styles.accentColor : "#e5e7eb" }}
              >
                <div
                  className={`px-3 py-2 text-white ${
                    preset.styles.headerStyle === "center"
                      ? "text-center"
                      : preset.styles.headerStyle === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                  style={{ backgroundColor: preset.styles.primaryColor }}
                >
                  <div className="text-[9px] font-bold tracking-wide">INVOICE</div>
                  <div className="text-[6px] opacity-80">Your business name</div>
                </div>
                <div className="p-3 text-[7px]">
                  <div
                    className={`grid grid-cols-[1fr_auto] gap-x-2 py-1 ${
                      preset.styles.tableStyle === "bordered" ? "border" : "border-b"
                    }`}
                    style={{ borderColor: preset.styles.accentColor }}
                  >
                    <span className="px-1 font-medium">Professional service</span>
                    <span className="px-1">R1,000.00</span>
                  </div>
                  <div
                    className="mt-2 ml-auto w-1/2 px-1.5 py-1 text-right font-bold text-white"
                    style={{ backgroundColor: preset.styles.primaryColor }}
                  >
                    Total R1,150.00
                  </div>
                  {preset.styles.showWatermark && (
                    <div className="mt-1 text-center text-[6px] uppercase tracking-[0.2em] text-gray-300">
                      Watermark
                    </div>
                  )}
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
