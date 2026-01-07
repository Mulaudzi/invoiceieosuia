import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateClient, useUpdateClient } from "@/hooks/useClients";
import { Client } from "@/lib/types";
import { Loader2 } from "lucide-react";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().regex(/^\+27\s?\d{2}\s?\d{3}\s?\d{4}$/, "Phone must be SA format: +27 XX XXX XXXX").optional().or(z.literal("")),
  company: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

export function ClientModal({ open, onOpenChange, client }: ClientModalProps) {
  const { toast } = useToast();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isEditing = !!client;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          name: client.name || "",
          email: client.email || "",
          phone: client.phone || "",
          company: client.company || "",
          address: client.address || "",
        });
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          company: "",
          address: "",
        });
      }
    }
  }, [open, client, reset]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (isEditing && client) {
        await updateClient.mutateAsync({ id: client.id, data });
        toast({ title: "Client updated successfully" });
      } else {
        await createClient.mutateAsync(data as Omit<Client, 'id' | 'userId' | 'createdAt'>);
        toast({ title: "Client created successfully" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEditing ? "Failed to update client" : "Failed to create client",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} placeholder="John Doe" />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone (SA format)</Label>
            <Input id="phone" {...register("phone")} placeholder="+27 XX XXX XXXX" />
            {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <Label htmlFor="company">Company</Label>
            <Input id="company" {...register("company")} placeholder="Company name" />
            {errors.company && <p className="text-sm text-destructive mt-1">{errors.company.message}</p>}
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" {...register("address")} placeholder="Full address" rows={2} />
            {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
