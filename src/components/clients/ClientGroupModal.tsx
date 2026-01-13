import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateClientGroup, useUpdateClientGroup } from "@/hooks/useClientGroups";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ClientGroup } from "@/services/clientGroupService";

const clientGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  color: z.string().optional(),
});

type ClientGroupFormData = z.infer<typeof clientGroupSchema>;

interface ClientGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: ClientGroup | null;
}

const colorOptions = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a855f7" },
];

export function ClientGroupModal({ open, onOpenChange, group }: ClientGroupModalProps) {
  const { toast } = useToast();
  const createGroup = useCreateClientGroup();
  const updateGroup = useUpdateClientGroup();
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  
  const isEditing = !!group;
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientGroupFormData>({
    resolver: zodResolver(clientGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (group) {
        reset({
          name: group.name,
          description: group.description || "",
        });
        setSelectedColor(group.color || "#6366f1");
      } else {
        reset({ name: "", description: "" });
        setSelectedColor("#6366f1");
      }
    }
  }, [open, group, reset]);

  const onSubmit = async (data: ClientGroupFormData) => {
    try {
      if (isEditing && group) {
        await updateGroup.mutateAsync({ id: group.id, data: { ...data, color: selectedColor } });
        toast({ title: "Group updated successfully" });
      } else {
        await createGroup.mutateAsync({ 
          name: data.name, 
          description: data.description, 
          color: selectedColor 
        });
        toast({ title: "Group created successfully" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEditing ? "Failed to update group" : "Failed to create group",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const isPending = createGroup.isPending || updateGroup.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Group" : "Create Group"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the group details below." : "Add a new group to organize your clients."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., VIP Clients"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Optional description for this group"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      selectedColor === color.value ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
