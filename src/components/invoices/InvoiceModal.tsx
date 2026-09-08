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
import { isValid } from "date-fns";
import { formatDateSafe, parseDateSafe } from "@/lib/dateUtils";
import { CalendarIcon, Plus, Trash2, Loader2, Upload } from "@/lib/icons";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useTemplates } from "@/hooks/useTemplates";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";
import { Invoice, Product } from "@/lib/types";
import { InlineProductForm } from "./InlineProductForm";
import { getCategory, getTemplate, documentTypes, getDocumentTitle } from "@/lib/invoiceArchitecture";
import type { InvoiceStartSelection } from "./InvoiceStartWizard";
import { invoiceTemplateRegistry } from "@/lib/invoiceArchitecture";
import { InvoiceDocument, type InvoiceDocumentData } from "./InvoiceDocument";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { LogoCropDialog } from "@/components/profile/LogoCropDialog";
import { mediaUrl } from "@/lib/mediaUrl";
import { usePrivateMediaUrl } from "@/hooks/usePrivateMediaUrl";
import type { RecurringInvoice } from "@/hooks/useRecurringInvoices";

const invoiceItemSchema = z.object({
  product_id: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  price: z.coerce.number().min(0, "Price must be positive"),
  tax_rate: z.coerce.number().min(0).max(100, "Tax rate must be 0-100"),
  sku: z.string().optional(), unit: z.string().optional(), group_name: z.string().optional(),
  discount_rate: z.coerce.number().min(0).max(100).default(0),
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
  selection?: InvoiceStartSelection;
  schedule?: RecurringInvoice | null;
  sourceInvoice?: Invoice | null;
}

export function InvoiceModal({ open, onOpenChange, invoice, selection, schedule, sourceInvoice }: InvoiceModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();
  const { data: templates = [] } = useTemplates();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const isEditing = !!invoice;
  const category = getCategory(invoice?.category ?? selection?.category);
  const [templateSlug, setTemplateSlug] = useState(getTemplate(invoice?.templateSlug ?? selection?.templateSlug).slug);
  const [showPreview, setShowPreview] = useState(false);
  const selectedTemplate = getTemplate(templateSlug);
  const documentType = invoice?.documentType ?? selection?.documentType ?? 'standard_invoice';
  const documentTypeName = documentTypes.find(item => item.id === documentType)?.name.replace('Standard ', '') || 'Invoice';
  const [metadata, setMetadata] = useState<Record<string,string|number>>({});
  const [invoiceLogoPreview, setInvoiceLogoPreview] = useState("");
  const [uploadingInvoiceLogo, setUploadingInvoiceLogo] = useState(false);
  const [logoCropFile, setLogoCropFile] = useState<File | null>(null);
  const privateInvoiceLogoPreview = usePrivateMediaUrl(invoiceLogoPreview);

  const profileDefaults = () => ({
    business_name:user?.businessName || user?.name || '', business_address:user?.address || '', business_email:user?.email || '',
    business_phone:user?.phone || '', business_tax_number:user?.taxNumber || '', business_registration_number:user?.registrationNumber || '',
    business_website:user?.website || '', invoice_logo_path:user?.logoPath || user?.logo_path || '', bank_name:user?.bankName || '',
    account_name:user?.accountName || '', account_number:user?.accountNumber || '', branch_code:user?.branchCode || '',
    swift_code:user?.swiftCode || '', payment_instructions:user?.paymentInstructions || 'Please include the invoice number in your payment reference.',
  });

  const validDateOr = (value: string | undefined, fallback: Date) => {
    const parsed = value ? new Date(value) : fallback;
    return isValid(parsed) ? parsed : fallback;
  };

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      client_id: "",
      template_id: "",
      date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: "",
      items: [{ name: "", description: "", quantity: 1, price: 0, tax_rate: 15, discount_rate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Reset form when invoice changes
  useEffect(() => {
    setTemplateSlug(getTemplate(invoice?.templateSlug ?? selection?.templateSlug).slug);
    if (invoice) {
      form.reset({
        client_id: invoice.clientId,
        template_id: invoice.templateId || "",
        date: validDateOr(invoice.date, new Date()),
        due_date: validDateOr(invoice.dueDate, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        notes: invoice.notes || "",
        items: invoice.items?.map((item) => ({
          product_id: item.productId ? String(item.productId) : undefined,
          name: item.name,
          description: "",
          quantity: item.quantity,
          price: item.price,
          tax_rate: item.taxRate,
          sku:item.sku || '', unit:item.unit || '', group_name:item.group || '', discount_rate:item.discountRate || 0,
        })) || [{ name: "", description: "", quantity: 1, price: 0, tax_rate: 15 }],
      });
      const saved = invoice.metadata || {};
      setMetadata({...profileDefaults(), ...saved});
      setInvoiceLogoPreview(String(saved.invoice_logo_path || user?.logoPath || user?.logo_path || ''));
    } else if (sourceInvoice) {
      form.reset({
        client_id: String(sourceInvoice.clientId),
        template_id: sourceInvoice.templateId || "",
        date: new Date(),
        due_date: new Date(),
        notes: `Created from ${sourceInvoice.invoiceNumber}`,
        items: documentType === 'receipt' ? [{ name: `Payment received for ${sourceInvoice.invoiceNumber}`, description: "", quantity: 1, price: sourceInvoice.amountPaid || sourceInvoice.total, tax_rate: 0, discount_rate: 0 }] : sourceInvoice.items?.map((item) => ({
          product_id: item.productId ? String(item.productId) : undefined,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          price: item.price,
          tax_rate: item.taxRate,
          sku: item.sku || "", unit: item.unit || "", group_name: item.group || "", discount_rate: item.discountRate || 0,
        })) || [{ name: "", description: "", quantity: 1, price: 0, tax_rate: 0, discount_rate: 0 }],
      });
      const inherited = { ...profileDefaults(), ...(sourceInvoice.metadata || {}), original_invoice_id: sourceInvoice.id, original_invoice_number: sourceInvoice.invoiceNumber, derived_document: 1 };
      setMetadata(inherited);
      setInvoiceLogoPreview(String(inherited.invoice_logo_path || ""));
    } else {
      form.reset({
        client_id: schedule ? String(schedule.client_id) : "",
        template_id: "",
        date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: schedule?.notes || "",
        items: schedule?.items?.length ? schedule.items.map(item=>({product_id:item.product_id?String(item.product_id):undefined,name:item.description,description:item.description,quantity:Number(item.quantity),price:Number(item.unit_price),tax_rate:Number(item.tax_rate||0),discount_rate:0})) : [{ name: "", description: "", quantity: 1, price: 0, tax_rate: 15, discount_rate: 0 }],
      });
      const defaults = profileDefaults();
      setMetadata(defaults);
      setInvoiceLogoPreview(String(defaults.invoice_logo_path || ''));
    }
  }, [invoice, sourceInvoice, selection?.templateSlug, form, user, schedule]);

  const watchItems = form.watch("items");
  const watchedClientId = form.watch("client_id");
  const selectedClient = clients.find(client => String(client.id) === String(watchedClientId));
  const previewData: InvoiceDocumentData = {
    business:{name:String(metadata.business_name || 'Your Business'),address:String(metadata.business_address || ''),email:String(metadata.business_email || ''),phone:String(metadata.business_phone || ''),vatNumber:String(metadata.business_tax_number || ''),registration:String(metadata.business_registration_number || ''),website:String(metadata.business_website || ''),logo:mediaUrl(invoiceLogoPreview || String(metadata.invoice_logo_path || ''))},
    customer:{name:selectedClient?.name || 'Select a client',company:selectedClient?.company,address:selectedClient?.address,email:selectedClient?.email,phone:selectedClient?.phone},
    invoiceNumber:invoice?.invoiceNumber || `${documentType==='credit_note'?'CN':documentType==='debit_note'?'DN':documentType==='receipt'?'REC':documentType==='quote'?'QUO':documentType==='pro_forma'?'PRO':'INV'}-DRAFT`,date:formatDateSafe(form.watch('date'),'dd MMM yyyy','—'),dueDate:formatDateSafe(form.watch('due_date'),'dd MMM yyyy','—'),currency:'ZAR',documentTitle:getDocumentTitle(documentType),reference:String(metadata.original_invoice_number || ''),
    items:watchItems.map(item=>({description:item.name || 'Invoice item',quantity:item.quantity || 0,unitPrice:item.price || 0,discount:item.discount_rate || 0,taxRate:item.tax_rate || 0})),notes:form.watch('notes'),paymentDetails:String(metadata.payment_instructions || ''),bankDetails:[['Bank',String(metadata.bank_name||'')],['Account name',String(metadata.account_name||'')],['Account number',String(metadata.account_number||'')],['Branch code',String(metadata.branch_code||'')],['SWIFT',String(metadata.swift_code||'')]],footer:documentType==='credit_note'?'Credit issued against the referenced invoice.':documentType==='debit_note'?'Debit adjustment issued against the referenced invoice.':documentType==='receipt'?'Payment received with thanks.':'Thank you for your business!',paidAmount:documentType==='receipt'?(sourceInvoice?.amountPaid || sourceInvoice?.total || invoice?.amountPaid):invoice?.amountPaid,paymentHistory:documentType==='receipt'?(sourceInvoice?.paymentHistory || invoice?.paymentHistory):invoice?.paymentHistory,
  };

  const setOverride = (key:string, value:string) => setMetadata(previous=>({...previous,[key]:value}));
  const handleInvoiceLogo = async (file?:File) => {
    if (!file) return;
    if (!["image/png","image/jpeg"].includes(file.type) || file.size > 2*1024*1024) { toast({title:"Use a PNG or JPG smaller than 2MB",variant:"destructive"}); return; }
    setInvoiceLogoPreview(URL.createObjectURL(file)); setUploadingInvoiceLogo(true);
    try { const body=new FormData(); body.append('logo',file); const response=await api.post<{logo_path:string}>('/upload-invoice-logo',body,{headers:{'Content-Type':'multipart/form-data'}}); setOverride('invoice_logo_path',response.data.logo_path); setInvoiceLogoPreview(response.data.logo_path); }
    catch { toast({title:"Invoice logo upload failed",variant:"destructive"}); }
    finally { setUploadingInvoiceLogo(false); }
  };

  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0) * (1-(item.discount_rate || 0)/100), 0);
  const taxTotal = watchItems.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.price || 0) * (1-(item.discount_rate || 0)/100);
    return sum + (itemTotal * (item.tax_rate || 0)) / 100;
  }, 0);
  const total = subtotal + taxTotal;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => String(p.id) === productId);
    if (product) {
      form.setValue(`items.${index}.product_id`, productId, { shouldDirty: true });
      form.setValue(`items.${index}.name`, product.name, { shouldDirty: true, shouldValidate: true });
      form.setValue(`items.${index}.description`, product.description || '', { shouldDirty: true });
      form.setValue(`items.${index}.price`, Number(product.price) || 0, { shouldDirty: true, shouldValidate: true });
      form.setValue(`items.${index}.tax_rate`, Number(product.taxRate) || 0, { shouldDirty: true, shouldValidate: true });
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const payload = {
        client_id: data.client_id,
        template_id: data.template_id || undefined,
        date: formatDateSafe(data.date, "yyyy-MM-dd", ""),
        due_date: formatDateSafe(data.due_date, "yyyy-MM-dd", ""),
        notes: data.notes,
        category: category.id, document_type: documentType, template_slug: selectedTemplate.slug,
        template_version: selectedTemplate.version, metadata,
        recurring_invoice_id: schedule?.id || invoice?.recurringInvoiceId || undefined,
        items: data.items.map((item) => ({
          product_id: item.product_id || undefined,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          price: item.price,
          tax_rate: item.tax_rate,
          sku:item.sku, unit:item.unit, group_name:item.group_name, discount_rate:item.discount_rate,
        })),
      };

      if (isEditing) {
        await updateInvoice.mutateAsync({ id: invoice.id, data: payload });
        toast({ title: "Invoice updated successfully" });
      } else {
        try {
          await createInvoice.mutateAsync(payload);
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (!message.includes("possible duplicate invoice")) throw error;
          const confirmed = window.confirm("An invoice with the same client, date, and amount already exists. Do you want to create another invoice anyway?");
          if (!confirmed) return;
          await createInvoice.mutateAsync({ ...payload, duplicate_confirmed: true });
        }
        toast({ title: "Invoice created successfully" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEditing ? "Invoice was not updated" : "Invoice was not created",
        description: error instanceof Error ? error.message : "Please review the invoice information and try again.",
        variant: "destructive",
      });
    }
  };

  const isPending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Invoice" : `Configure ${documentTypes.find(x=>x.id===documentType)?.name || 'Invoice'}`}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update invoice details below." : "Fill in the details to create a new invoice."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-3 flex flex-wrap items-center justify-between gap-3 text-sm"><span><b>{category.name}</b> · {selectedTemplate.name}</span><div className="flex gap-2"><Select value={templateSlug} onValueChange={setTemplateSlug}><SelectTrigger className="w-56 bg-background"><SelectValue/></SelectTrigger><SelectContent>{invoiceTemplateRegistry.filter(template=>(template.category===category.id||template.slug===templateSlug)&&template.supportedDocumentTypes.includes(documentType as any)).map(template=><SelectItem key={template.slug} value={template.slug}>{template.name}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" onClick={()=>setShowPreview(true)}>Preview</Button></div></div>
            <div className="overflow-auto rounded-lg border bg-muted/20 p-3"><button type="button" className="block mx-auto" onClick={()=>setShowPreview(true)} aria-label="Open full invoice preview"><InvoiceDocument templateSlug={templateSlug} data={previewData} scale={0.34} primaryColor={String(metadata.primary_color||'')||undefined} accentColor={String(metadata.accent_color||'')||undefined}/></button><p className="text-center text-xs text-muted-foreground mt-2">Live preview — updates as you complete the invoice. Click to enlarge.</p></div>
            <details className="rounded-lg border bg-card"><summary className="cursor-pointer p-4 font-medium">Invoice colours</summary><div className="px-4 pb-4 flex flex-wrap items-end gap-4"><label className="text-sm font-medium">Primary colour<Input className="mt-1 h-10 w-24 p-1" type="color" value={String(metadata.primary_color||'#0756a0')} onChange={e=>setOverride('primary_color',e.target.value)}/></label><label className="text-sm font-medium">Accent colour<Input className="mt-1 h-10 w-24 p-1" type="color" value={String(metadata.accent_color||'#dceafa')} onChange={e=>setOverride('accent_color',e.target.value)}/></label><Button type="button" variant="outline" onClick={()=>setMetadata(previous=>{const next={...previous};delete next.primary_color;delete next.accent_color;return next})}>Use design colours</Button></div></details>
            <details className="rounded-lg border bg-card"><summary className="cursor-pointer p-4 font-medium">Business identity and invoice logo</summary><div className="px-4 pb-4 space-y-4">
              <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Inherited from your profile. Changes here apply only to this invoice.</p><Button type="button" size="sm" variant="outline" onClick={()=>{const defaults=profileDefaults();setMetadata(previous=>({...previous,...defaults}));setInvoiceLogoPreview(String(defaults.invoice_logo_path||''))}}>Reset to profile defaults</Button></div>
              <div className="grid md:grid-cols-2 gap-3">
                {[['business_name','Business name'],['business_email','Business email'],['business_phone','Business phone'],['business_tax_number','VAT / tax number'],['business_registration_number','Registration number'],['business_website','Website']].map(([key,label])=><label key={key} className="text-sm font-medium">{label}<Input className="mt-1" value={String(metadata[key]||'')} onChange={e=>setOverride(key,e.target.value)}/></label>)}
                <label className="md:col-span-2 text-sm font-medium">Business address<Textarea className="mt-1" value={String(metadata.business_address||'')} onChange={e=>setOverride('business_address',e.target.value)}/></label>
              </div>
              <div className="flex flex-wrap items-center gap-4"><div className="w-24 h-20 border rounded bg-muted/30 grid place-items-center overflow-hidden">{privateInvoiceLogoPreview?<img src={privateInvoiceLogoPreview} className="max-w-full max-h-full object-contain" alt="Invoice logo preview"/>:<span className="text-xs text-muted-foreground">No logo</span>}</div><label><input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e=>setLogoCropFile(e.target.files?.[0]||null)}/><Button type="button" variant="outline" asChild disabled={uploadingInvoiceLogo}><span><Upload className="w-4 h-4 mr-2"/>{uploadingInvoiceLogo?'Uploading…':'Crop / override logo'}</span></Button></label><Button type="button" variant="ghost" onClick={()=>{setOverride('invoice_logo_path','');setInvoiceLogoPreview('')}}>Remove</Button></div>
            </div></details>
            <details className="rounded-lg border bg-card"><summary className="cursor-pointer p-4 font-medium">Payment details</summary><div className="px-4 pb-4"><p className="text-sm text-muted-foreground mb-3">Inherited from your profile and editable for this invoice.</p><div className="grid md:grid-cols-2 gap-3">{[['bank_name','Bank name'],['account_name','Account name'],['account_number','Account number'],['branch_code','Branch code'],['swift_code','SWIFT / BIC']].map(([key,label])=><label key={key} className="text-sm font-medium">{label}<Input className="mt-1" value={String(metadata[key]||'')} onChange={e=>setOverride(key,e.target.value)}/></label>)}<label className="md:col-span-2 text-sm font-medium">Payment instructions<Textarea className="mt-1" value={String(metadata.payment_instructions||'')} onChange={e=>setOverride('payment_instructions',e.target.value)}/></label></div></div></details>
            {sourceInvoice && <section className="rounded-lg border bg-primary/5 p-4"><h3 className="font-medium">Linked to {sourceInvoice.invoiceNumber}</h3><p className="mt-1 text-sm text-muted-foreground">The client and original invoice are linked automatically. {documentType==='credit_note'?'Keep only the invoice items being credited, then adjust their quantity or amount below.':documentType==='debit_note'?'Add or adjust the extra items and amounts being charged below.':'Relevant payment details have been carried over.'}</p><div className="mt-3 grid gap-3 md:grid-cols-2">{documentType==='credit_note'&&<label className="text-sm font-medium">Reason for credit<Textarea className="mt-1" value={String(metadata.credit_reason||'')} onChange={e=>setOverride('credit_reason',e.target.value)} placeholder="Return, correction, discount, or other reason"/></label>}{documentType==='debit_note'&&<label className="text-sm font-medium">Reason for debit<Textarea className="mt-1" value={String(metadata.debit_reason||'')} onChange={e=>setOverride('debit_reason',e.target.value)} placeholder="Additional charge or adjustment reason"/></label>}{documentType==='receipt'&&<><label className="text-sm font-medium">Payment method<Input className="mt-1" value={String(metadata.payment_method||'')} onChange={e=>setOverride('payment_method',e.target.value)} placeholder="EFT, cash, card, etc."/></label><label className="text-sm font-medium">Payment reference<Input className="mt-1" value={String(metadata.payment_reference||'')} onChange={e=>setOverride('payment_reference',e.target.value)}/></label></>}</div></section>}
            {category.fields.length > 0 && <div><h3 className="font-medium mb-3">{category.shortName} details</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{category.fields.map(item=><label key={item.key} className="text-sm font-medium">{item.label}<Input className="mt-2" type={item.type || 'text'} value={metadata[item.key] ?? ''} onChange={e=>setMetadata(prev=>({...prev,[item.key]:item.type==='number' ? Number(e.target.value) : e.target.value}))}/></label>)}</div></div>}
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
                          <SelectItem key={client.id} value={String(client.id)}>
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
                          <SelectItem key={template.id} value={String(template.id)}>
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
                    <FormLabel>{documentType==='receipt'?'Payment Date':documentType==='credit_note'?'Credit Note Date':documentType==='debit_note'?'Debit Note Date':'Invoice Date'} *</FormLabel>
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
                            {parseDateSafe(field.value) ? formatDateSafe(field.value, "PPP") : <span>Pick a date</span>}
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
                  <FormItem className={cn("flex flex-col", (documentType==='credit_note'||documentType==='receipt')&&"hidden")}>
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
                            {parseDateSafe(field.value) ? formatDateSafe(field.value, "PPP") : <span>Pick a date</span>}
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
                <FormLabel className="text-base">{documentType==='credit_note'?'Credit Items':documentType==='debit_note'?'Debit Charges':documentType==='receipt'?'Payment Received':'Line Items'} *</FormLabel>
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
                        discount_rate: 0,
                      });
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", description: "", quantity: 1, price: 0, tax_rate: 15, discount_rate: 0 })}
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
                      {category.groups && <th className="text-left p-3 text-sm font-medium w-28">Group</th>}
                      {category.columns.some(c => c.key === 'sku') && <th className="text-left p-3 text-sm font-medium w-24">SKU</th>}
                      <th className="text-left p-3 text-sm font-medium">{category.columns.find(c => c.key === 'name')?.label || 'Item'}</th>
                      <th className="text-left p-3 text-sm font-medium w-20">Qty</th>
                      <th className="text-left p-3 text-sm font-medium w-28">Price</th>
                      <th className="text-left p-3 text-sm font-medium w-20">Discount</th>
                      <th className="text-left p-3 text-sm font-medium w-20">Tax %</th>
                      <th className="text-right p-3 text-sm font-medium w-28">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const item = watchItems[index];
                      const itemTotal = (item?.quantity || 0) * (item?.price || 0) * (1 - (item?.discount_rate || 0) / 100);
                      const itemTax = (itemTotal * (item?.tax_rate || 0)) / 100;

                      return (
                        <tr key={field.id} className="border-t">
                          {category.groups && <td className="p-2"><Select value={item?.group_name || ''} onValueChange={value => form.setValue(`items.${index}.group_name`, value)}><SelectTrigger><SelectValue placeholder="Group" /></SelectTrigger><SelectContent>{category.groups.map(group => <SelectItem key={group} value={group}>{group}</SelectItem>)}</SelectContent></Select></td>}
                          {category.columns.some(c => c.key === 'sku') && <td className="p-2"><Input {...form.register(`items.${index}.sku`)} placeholder="SKU" /></td>}
                          <td className="p-2">
                            <div className="space-y-2">
                              <Select
                                value={item?.product_id ? String(item.product_id) : undefined}
                                onValueChange={(val) => handleProductSelect(index, val)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select or type custom" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={String(product.id)}>
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
                          <td className="p-2"><Input {...form.register(`items.${index}.discount_rate`)} type="number" min="0" max="100" className="h-9" /></td>
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
                    {isEditing ? `Updating ${documentTypeName}...` : `Creating ${documentTypeName}...`}
                  </>
                ) : isEditing ? (
                  `Update ${documentTypeName}`
                ) : (
                  `Create ${documentTypeName}`
                )}
              </Button>
            </DialogFooter>
            {showPreview&&<div className="fixed inset-0 z-[90] bg-black/80 p-3 md:p-8 overflow-auto" onClick={()=>setShowPreview(false)}><div className="max-w-4xl mx-auto" onClick={event=>event.stopPropagation()}><div className="sticky top-0 z-10 flex justify-between items-center bg-background rounded-lg p-3 mb-4"><div><b>{selectedTemplate.name}</b><p className="text-xs text-muted-foreground">Live {getDocumentTitle(documentType).toLowerCase()} data · A4 preview</p></div><Button type="button" onClick={()=>setShowPreview(false)}>Back to editor</Button></div><InvoiceDocument templateSlug={templateSlug} data={previewData} scale={0.72} primaryColor={String(metadata.primary_color||'')||undefined} accentColor={String(metadata.accent_color||'')||undefined}/></div></div>}
            <LogoCropDialog file={logoCropFile} onCancel={()=>setLogoCropFile(null)} onCrop={file=>{setLogoCropFile(null);void handleInvoiceLogo(file)}}/>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
