import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteClientGroup } from "@/hooks/useClientGroups";
import { useToast } from "@/hooks/use-toast";
import { ClientGroup } from "@/services/clientGroupService";
import { Loader2 } from "lucide-react";

interface DeleteClientGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ClientGroup | null;
}

export function DeleteClientGroupDialog({ open, onOpenChange, group }: DeleteClientGroupDialogProps) {
  const { toast } = useToast();
  const deleteGroup = useDeleteClientGroup();

  const handleDelete = async () => {
    if (!group) return;
    
    try {
      await deleteGroup.mutateAsync(group.id);
      toast({ title: "Group deleted successfully" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to delete group",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Group</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{group?.name}</strong>? 
            Clients in this group will not be deleted, but will be unassigned from this group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteGroup.isPending}
          >
            {deleteGroup.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
