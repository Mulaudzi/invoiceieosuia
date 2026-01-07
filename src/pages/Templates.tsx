import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { templateService } from "@/lib/mockData";
import { Template } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Palette,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Templates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>(() =>
    user ? templateService.getAll(user.id) : []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const refreshTemplates = () => {
    if (user) setTemplates(templateService.getAll(user.id));
  };

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({ name: template.name, description: template.description });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingTemplate) {
      templateService.update(editingTemplate.id, {
        name: formData.name,
        description: formData.description,
      });
      toast({ title: "Template updated successfully" });
    } else {
      templateService.create({
        userId: user.id,
        name: formData.name,
        description: formData.description,
        isDefault: templates.length === 0,
      });
      toast({ title: "Template created successfully" });
    }

    refreshTemplates();
    setIsModalOpen(false);
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
            <Button variant="accent" onClick={openAddModal}>
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-card rounded-xl border border-border p-6 shadow-soft card-hover relative"
              >
                {template.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Default
                    </span>
                  </div>
                )}

                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-accent" />
                </div>

                <h3 className="font-semibold text-foreground mb-2">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(template)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {!template.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(template.id)}>
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
                      <DropdownMenuItem onClick={() => handleDelete(template.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">Create your first invoice template</p>
              <Button variant="accent" onClick={openAddModal}>
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Professional Blue"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the template"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                {editingTemplate ? "Save Changes" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
