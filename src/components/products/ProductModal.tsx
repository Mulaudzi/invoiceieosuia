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
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { Product } from "@/lib/types";
import { Loader2 } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  taxRate: z.coerce.number().min(0).max(100, "Tax rate must be 0-100"),
  category: z.string().max(50).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductModal({ open, onOpenChange, product }: ProductModalProps) {
  const { toast } = useToast();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      taxRate: 15,
      category: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name || "",
          description: product.description || "",
          price: product.price || 0,
          taxRate: product.taxRate || 15,
          category: product.category || "",
        });
      } else {
        reset({
          name: "",
          description: "",
          price: 0,
          taxRate: 15,
          category: "",
        });
      }
    }
  }, [open, product, reset]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditing && product) {
        await updateProduct.mutateAsync({ id: product.id, data });
        toast({ title: "Product updated successfully" });
      } else {
        await createProduct.mutateAsync(data as Omit<Product, 'id' | 'userId' | 'createdAt'>);
        toast({ title: "Product created successfully" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEditing ? "Failed to update product" : "Failed to create product",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" {...register("name")} placeholder="Product name" />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} placeholder="Product description" rows={2} />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (R) *</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="taxRate">Tax Rate (%) *</Label>
              <Input id="taxRate" type="number" step="0.01" {...register("taxRate")} />
              {errors.taxRate && <p className="text-sm text-destructive mt-1">{errors.taxRate.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...register("category")} placeholder="e.g., Services, Products" />
            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
