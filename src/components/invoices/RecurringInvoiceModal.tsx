import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useCreateRecurringInvoice, useUpdateRecurringInvoice, RecurringInvoice } from "@/hooks/useRecurringInvoices";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

const formSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  description: z.string().min(1, "Description is required"),
  frequency: z.string().min(1, "Frequency is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

interface RecurringInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringInvoice?: RecurringInvoice | null;
}

interface LineItem {
  id: string;
  product_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
}

export function RecurringInvoiceModal({ open, onOpenChange, recurringInvoice }: RecurringInvoiceModalProps) {
  const { toast } = useToast();
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();
  const createRecurring = useCreateRecurringInvoice();
  const updateRecurring = useUpdateRecurringInvoice();
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 }
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: "",
      description: "",
      frequency: "monthly",
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: "",
      notes: "",
      terms: "",
    },
  });

  useEffect(() => {
    if (recurringInvoice) {
      form.reset({
        client_id: recurringInvoice.client_id.toString(),
        description: recurringInvoice.description,
        frequency: recurringInvoice.frequency,
        start_date: recurringInvoice.start_date.split('T')[0],
        end_date: recurringInvoice.end_date?.split('T')[0] || "",
        notes: recurringInvoice.notes || "",
        terms: recurringInvoice.terms || "",
      });
      
      if (recurringInvoice.items?.length > 0) {
        setLineItems(recurringInvoice.items.map(item => ({
          id: crypto.randomUUID(),
          product_id: item.product_id || undefined,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })));
      }
    } else {
      form.reset({
        client_id: "",
        description: "",
        frequency: "monthly",
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: "",
        notes: "",
        terms: "",
      });
      setLineItems([{ id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 }]);
    }
  }, [recurringInvoice, form, open]);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleProductSelect = (id: string, productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      setLineItems(lineItems.map(item => {
        if (item.id === id) {
          return {
            ...item,
            product_id: typeof product.id === 'string' ? parseInt(product.id) : product.id,
            description: product.name,
            unit_price: product.price,
          };
        }
        return item;
      }));
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const data = {
        client_id: parseInt(values.client_id),
        description: values.description,
        frequency: values.frequency,
        start_date: values.start_date,
        end_date: values.end_date || undefined,
        notes: values.notes,
        terms: values.terms,
        items: lineItems.map(item => ({
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      if (recurringInvoice) {
        await updateRecurring.mutateAsync({ id: recurringInvoice.id, data });
        toast({ title: "Recurring invoice updated successfully" });
      } else {
        await createRecurring.mutateAsync(data);
        toast({ title: "Recurring invoice created successfully" });
      }
      
      onOpenChange(false);
    } catch (error) {
      toast({ 
        title: `Failed to ${recurringInvoice ? 'update' : 'create'} recurring invoice`, 
        variant: "destructive" 
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const isLoading = createRecurring.isPending || updateRecurring.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recurringInvoice ? "Edit Recurring Invoice" : "Create Recurring Invoice"}</DialogTitle>
          <DialogDescription>
            Set up automatic invoice generation on a schedule
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly retainer, Hosting services" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Line Items</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Select 
                        value={item.product_id?.toString() || ""} 
                        onValueChange={(value) => handleProductSelect(item.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {formatCurrency(product.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        min={1}
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        step="0.01"
                      />
                    </div>
                    <div className="w-24 text-right pt-2 font-medium">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end p-4 bg-muted/50 rounded-lg">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total per invoice</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(calculateTotal())}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Payment terms..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {recurringInvoice ? "Update" : "Create"} Recurring Invoice
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}