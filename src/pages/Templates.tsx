import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { templateService } from "@/lib/mockData";
import { Template, TemplateStyles, defaultTemplateStyles } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Plus, Palette, ArrowLeft } from "lucide-react";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { TemplateCard } from "@/components/templates/TemplateCard";

const Templates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>(() =>
    user ? templateService.getAll(user.id) : []
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const refreshTemplates = () => {
    if (user) setTemplates(templateService.getAll(user.id));
  };

  const openEditor = (template: Template | null = null) => {
    setEditingTemplate(template);
    setIsEditing(true);
  };

  const handleSave = (name: string, description: string, styles: TemplateStyles) => {
    if (!user) return;

    if (editingTemplate) {
      templateService.update(editingTemplate.id, { name, description, styles });
      toast({ title: "Template updated successfully" });
    } else {
      templateService.create({
        userId: user.id,
        name,
        description,
        styles,
        isDefault: templates.length === 0,
      });
      toast({ title: "Template created successfully" });
    }

    refreshTemplates();
    setIsEditing(false);
    setEditingTemplate(null);
  };

  const handleSetDefault = (id: string) => {
    templates.forEach((t) => {
      templateService.update(t.id, { isDefault: t.id === id });
    });
    toast({ title: "Default template updated" });
    refreshTemplates();
  };

  const handleDelete = (id: string) => {
    templateService.delete(id);
    toast({ title: "Template deleted" });
    refreshTemplates();
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

          {/* Templates Grid */}
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

          {templates.length === 0 && (
            <div className="text-center py-12">
              <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">Create your first invoice template</p>
              <Button variant="accent" onClick={() => openEditor()}>
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Templates;
