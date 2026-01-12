import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Template, TemplateStyles, defaultTemplateStyles } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useSetDefaultTemplate } from "@/hooks/useTemplates";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { ApiErrorFallback } from "@/components/ApiErrorFallback";
import { Plus, Palette, ArrowLeft } from "lucide-react";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplatePresets } from "@/components/templates/TemplatePresets";

const Templates = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const { data: templates = [], isLoading, error, refetch } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const setDefaultTemplate = useSetDefaultTemplate();

  const openEditor = (template: Template | null = null) => {
    setEditingTemplate(template);
    setIsEditing(true);
  };

  const handleSave = async (name: string, description: string, styles: TemplateStyles) => {
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          data: { name, description, styles },
        });
        toast({ title: "Template updated successfully" });
      } else {
        await createTemplate.mutateAsync({
          name,
          description,
          styles,
          isDefault: templates.length === 0,
        });
        toast({ title: "Template created successfully" });
      }

      setIsEditing(false);
      setEditingTemplate(null);
    } catch (error) {
      toast({
        title: editingTemplate ? "Failed to update template" : "Failed to create template",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultTemplate.mutateAsync(id);
      toast({ title: "Default template updated" });
    } catch (error) {
      toast({
        title: "Failed to set default template",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast({ title: "Template deleted" });
    } catch (error) {
      toast({
        title: "Failed to delete template",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <div className="h-16 border-b border-border flex items-center px-6 gap-4">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h1 className="font-semibold text-foreground">
              {editingTemplate ? "Edit Template" : "Create Template"}
            </h1>
          </div>
          <main className="p-6 h-[calc(100vh-4rem)]">
            <TemplateEditor
              template={editingTemplate}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader title="Templates" subtitle="Customize your invoice templates" />

        <main className="p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {templates.length} template{templates.length !== 1 ? "s" : ""} available
            </p>
            <Button variant="accent" onClick={() => openEditor()}>
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && <PageLoadingSpinner message="Loading templates..." />}

          {/* Error State */}
          {error && (
            <ApiErrorFallback
              error={error instanceof Error ? error : null}
              onRetry={() => refetch()}
              title="Failed to load templates"
              description="There was a problem fetching your templates. Please try again."
            />
          )}

          {/* Templates Grid */}
          {!isLoading && !error && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={openEditor}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Template Presets Section */}
          {!isLoading && !error && (
            <div className="mt-8 pt-8 border-t border-border">
              <TemplatePresets onTemplateCreated={() => refetch()} />
            </div>
          )}

          {!isLoading && !error && templates.length === 0 && (
            <div className="text-center py-12">
              <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">Create your first invoice template or choose from presets above</p>
              <Button variant="accent" onClick={() => openEditor()}>
                <Plus className="w-4 h-4" />
                Create Custom Template
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Templates;
