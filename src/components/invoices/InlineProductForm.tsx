import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateProduct } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { Product } from "@/lib/types";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  taxRate: z.coerce.number().min(0).max(100, "Tax rate must be 0-100"),
  category: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface InlineProductFormProps {
  onProductCreated: (product: Product) => void;
}

export function InlineProductForm({ onProductCreated }: InlineProductFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createProduct = useCreateProduct();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      taxRate: 15,
      category: "",
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      const product = await createProduct.mutateAsync({
        name: data.name,
        description: data.description || "",
        price: data.price,
        taxRate: data.taxRate,
        category: data.category || "General",
      });
      
      toast({ title: "Product created successfully" });
      onProductCreated(product);
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to create product",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1"
      >
        <Plus className="w-3 h-3" />
        New Product
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Add a new product/service that can be used in invoices.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g., Web Development"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...form.register("description")}
                placeholder="Brief description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (ZAR) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("price")}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  {...form.register("taxRate")}
                />
                {form.formState.errors.taxRate && (
                  <p className="text-sm text-destructive">{form.formState.errors.taxRate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...form.register("category")}
                placeholder="e.g., Services, Products"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={createProduct.isPending}>
                {createProduct.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
