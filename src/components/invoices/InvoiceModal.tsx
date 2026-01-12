import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useTemplates } from "@/hooks/useTemplates";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";
import { Invoice, Product } from "@/lib/types";
import { InlineProductForm } from "./InlineProductForm";

const invoiceItemSchema = z.object({
  product_id: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  price: z.coerce.number().min(0, "Price must be positive"),
  tax_rate: z.coerce.number().min(0).max(100, "Tax rate must be 0-100"),
});

const invoiceFormSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  template_id: z.string().optional(),
  date: z.date({ required_error: "Invoice date is required" }),
  due_date: z.date({ required_error: "Due date is required" }),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
}

export function InvoiceModal({ open, onOpenChange, invoice }: InvoiceModalProps) {
  const { toast } = useToast();
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();
  const { data: templates = [] } = useTemplates();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const isEditing = !!invoice;

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      client_id: "",
      template_id: "",
      date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: "",
      items: [{ name: "", description: "", quantity: 1, price: 0, tax_rate: 15 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Reset form when invoice changes
  useEffect(() => {
    if (invoice) {
      form.reset({
        client_id: invoice.clientId,
        template_id: "",
        date: new Date(invoice.date),
        due_date: new Date(invoice.dueDate),
        notes: invoice.notes || "",
        items: invoice.items?.map((item) => ({
          product_id: item.productId,
          name: item.name,
          description: "",
          quantity: item.quantity,
          price: item.price,
          tax_rate: item.taxRate,
        })) || [{ name: "", description: "", quantity: 1, price: 0, tax_rate: 15 }],
      });
    } else {
      form.reset({
        client_id: "",
        template_id: "",
        date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: "",
        items: [{ name: "", description: "", quantity: 1, price: 0, tax_rate: 15 }],
      });
    }
  }, [invoice, form]);

  const watchItems = form.watch("items");

  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
  const taxTotal = watchItems.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.price || 0);
    return sum + (itemTotal * (item.tax_rate || 0)) / 100;
  }, 0);
  const total = subtotal + taxTotal;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.product_id`, productId);
      form.setValue(`items.${index}.name`, product.name);
      form.setValue(`items.${index}.description`, product.description);
      form.setValue(`items.${index}.price`, product.price);
      form.setValue(`items.${index}.tax_rate`, product.taxRate);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const payload = {
        client_id: data.client_id,
        template_id: data.template_id || undefined,
        date: format(data.date, "yyyy-MM-dd"),
        due_date: format(data.due_date, "yyyy-MM-dd"),
        notes: data.notes,
        items: data.items.map((item) => ({
          product_id: item.product_id || undefined,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          price: item.price,
          tax_rate: item.tax_rate,
        })),
      };

      if (isEditing) {
        await updateInvoice.mutateAsync({ id: invoice.id, data: payload });
        toast({ title: "Invoice updated successfully" });
      } else {
        await createInvoice.mutateAsync(payload);
        toast({ title: "Invoice created successfully" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEditing ? "Failed to update invoice" : "Failed to create invoice",
        variant: "destructive",
      });
    }
  };

  const isPending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update invoice details below." : "Fill in the details to create a new invoice."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Template Selection */}
              <FormField
                control={form.control}
                name="template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Default template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Invoice Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <FormLabel className="text-base">Line Items *</FormLabel>
                <div className="flex gap-2">
                  <InlineProductForm 
                    onProductCreated={(product: Product) => {
                      // Auto-add the newly created product as a line item
                      append({
                        product_id: product.id,
                        name: product.name,
                        description: product.description,
                        quantity: 1,
                        price: product.price,
                        tax_rate: product.taxRate,
                      });
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", description: "", quantity: 1, price: 0, tax_rate: 15 })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Product/Item</th>
                      <th className="text-left p-3 text-sm font-medium w-20">Qty</th>
                      <th className="text-left p-3 text-sm font-medium w-28">Price</th>
                      <th className="text-left p-3 text-sm font-medium w-20">Tax %</th>
                      <th className="text-right p-3 text-sm font-medium w-28">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const item = watchItems[index];
                      const itemTotal = (item?.quantity || 0) * (item?.price || 0);
                      const itemTax = (itemTotal * (item?.tax_rate || 0)) / 100;

                      return (
                        <tr key={field.id} className="border-t">
                          <td className="p-2">
                            <div className="space-y-2">
                              <Select onValueChange={(val) => handleProductSelect(index, val)}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select or type custom" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} - {formatCurrency(product.price)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                {...form.register(`items.${index}.name`)}
                                placeholder="Item name"
                                className="h-9"
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <Input
                              {...form.register(`items.${index}.quantity`)}
                              type="number"
                              min="1"
                              className="h-9"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              {...form.register(`items.${index}.price`)}
                              type="number"
                              min="0"
                              step="0.01"
                              className="h-9"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              {...form.register(`items.${index}.tax_rate`)}
                              type="number"
                              min="0"
                              max="100"
                              className="h-9"
                            />
                          </td>
                          <td className="p-2 text-right font-medium">
                            {formatCurrency(itemTotal + itemTax)}
                          </td>
                          <td className="p-2">
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {form.formState.errors.items && (
                <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
              )}
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>{formatCurrency(taxTotal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes or payment instructions..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Invoice"
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
