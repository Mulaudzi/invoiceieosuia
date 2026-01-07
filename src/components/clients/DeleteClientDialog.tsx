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
import { useDeleteClient } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function DeleteClientDialog({ open, onOpenChange, client }: DeleteClientDialogProps) {
  const { toast } = useToast();
  const deleteClient = useDeleteClient();

  const handleDelete = async () => {
    if (!client) return;
    
    try {
      await deleteClient.mutateAsync(client.id);
      toast({ title: "Client deleted successfully" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to delete client",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Client</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{client?.name}</strong>? This action cannot be undone.
            All associated invoices will remain but will no longer be linked to this client.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteClient.isPending}
          >
            {deleteClient.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
