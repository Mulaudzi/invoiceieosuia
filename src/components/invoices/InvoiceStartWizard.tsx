import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Eye, FileText, Heart, Search, Sparkles, Star } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { documentTypes, getCategory, getDocumentTitle, invoiceCategories, invoiceTemplateRegistry, type DocumentTypeId } from '@/lib/invoiceArchitecture';
import { InvoiceDocument, sampleInvoiceData as baseSampleInvoiceData } from './InvoiceDocument';

export interface InvoiceStartSelection { category: string; documentType: DocumentTypeId; templateSlug: string }
interface Props { open:boolean; onOpenChange:(open:boolean)=>void; onContinue:(selection:InvoiceStartSelection)=>void }

const readList = (key:string): string[] => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};

const documentPrefixes:Partial<Record<DocumentTypeId,string>> = {credit_note:'CN',debit_note:'DN',receipt:'REC',quote:'QUO',pro_forma:'PRO'};
const categoryExamples:Record<string,string[]> = {
  general:['Professional services','Business supplies'], services:['Consulting services','Project support'], products:['Product order','Delivery charge'], freelancer:['Project milestone','Additional revisions'],
  construction:['Labour','Building materials'], repair:['Repair labour','Replacement parts'], rental:['Rental period','Service charge'], transport:['Delivery service','Fuel surcharge'],
  hospitality:['Venue package','Catering services'], professional:['Professional consultation','Disbursements'], medical:['Consultation','Treatment / procedure'], education:['Tuition','Course materials'],
  recurring:['Monthly subscription','Usage charge'], wholesale:['Bulk product order','Freight'], creative:['Creative production','Editing'], automotive:['Workshop labour','Vehicle parts'],
};

export function InvoiceStartWizard({ open, onOpenChange, onContinue }:Props) {
  const creationDocumentTypes: DocumentTypeId[] = ['standard_invoice','tax_invoice','pro_forma','final','quote','credit_note','debit_note','receipt'];
  const [step,setStep] = useState<'category'|'template'>('category');
  const [category,setCategory] = useState(localStorage.getItem('invoice:last-category') || 'general');
  const [documentType,setDocumentType] = useState<DocumentTypeId>((localStorage.getItem('invoice:last-document-type') as DocumentTypeId) || 'standard_invoice');
  const [search,setSearch] = useState('');
  const [sort,setSort] = useState('recommended');
  const [preview,setPreview] = useState<string>();
  const [favourites,setFavourites] = useState<string[]>(() => readList('invoice:favourites'));
  const selectedCategory = getCategory(category);
  const availableCategories = invoiceCategories.filter(item=>item.documentTypes.includes(documentType));
  const designCategory = selectedCategory.documentTypes.includes(documentType) ? category : 'general';
  const previewData = useMemo(() => {
    const examples=categoryExamples[designCategory] || categoryExamples.general;
    const prefix=documentPrefixes[documentType] || 'INV';
    const customerName=designCategory==='medical'?'Example Patient':designCategory==='education'?'Example Learner':'Example Client';
    return {...baseSampleInvoiceData,documentTitle:getDocumentTitle(documentType),invoiceNumber:`${prefix}-0001`,customer:{...baseSampleInvoiceData.customer,name:customerName},items:[{description:examples[0],quantity:1,unitPrice:2500,taxRate:documentType==='tax_invoice'?15:0},{description:examples[1],quantity:1,unitPrice:750,taxRate:documentType==='tax_invoice'?15:0}],notes:`Example ${getDocumentTitle(documentType).toLowerCase()} for ${getCategory(designCategory).name}.`};
  },[designCategory,documentType]);
  const sampleInvoiceData=previewData;
  const templates = useMemo(() => invoiceTemplateRegistry
    .filter(t => t.category === designCategory && t.supportedDocumentTypes.includes(documentType))
    .filter(t => `${t.name} ${t.description} ${t.industry.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name) : Number(b[sort as 'popular'|'recommended']) - Number(a[sort as 'popular'|'recommended'])), [designCategory,documentType,search,sort]);

  const chooseCategory = (id:string) => {
    setCategory(id);
    setStep('template');
  };
  useEffect(()=>{if(open){setStep('category');setSearch('');setPreview(undefined);}},[open]);
  const toggleFavourite=(slug:string) => {
    const next=favourites.includes(slug) ? favourites.filter(x=>x!==slug) : [...favourites,slug];
    setFavourites(next); localStorage.setItem('invoice:favourites',JSON.stringify(next));
  };
  const useTemplate=(slug:string) => {
    localStorage.setItem('invoice:last-category',category); localStorage.setItem('invoice:last-document-type',documentType);
    localStorage.setItem('invoice:last-template',slug);
    const recent=[slug,...readList('invoice:recent').filter(x=>x!==slug)].slice(0,8);
    localStorage.setItem('invoice:recent',JSON.stringify(recent));
    onContinue({category,documentType,templateSlug:slug});
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{step==='category' ? 'What are you creating?' : 'Choose a Design'}</DialogTitle>
        <DialogDescription>{step==='category' ? 'Choose a document type, then select what it is for. Your choices prefill the preview and creation form.' : `${templates.length} designs for ${getDocumentTitle(documentType)} · ${selectedCategory.name}.`}</DialogDescription>
      </DialogHeader>
      {step==='category' ? <div className="space-y-5 py-2">
        <div><p className="mb-2 text-sm font-medium">Document type</p><div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Document type">{creationDocumentTypes.map(id => <Button key={id} type="button" size="sm" variant={documentType===id?'default':'outline'} className="shrink-0 rounded-full" role="tab" aria-selected={documentType===id} onClick={()=>setDocumentType(id)}>{documentTypes.find(item=>item.id===id)?.name}</Button>)}</div></div>
        <div><div className="mb-3"><p className="text-sm font-medium">What is it for?</p><p className="text-xs text-muted-foreground">Select a category to see matching templates.</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {availableCategories.map(item=><button type="button" key={item.id} onClick={()=>chooseCategory(item.id)} className="text-left rounded-xl border bg-card p-4 hover:border-primary hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary">
          <div className="flex items-start justify-between"><div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><FileText className="h-5 w-5"/></div>{item.popular && <Badge>Popular</Badge>}</div>
          <h3 className="font-semibold mt-3">{item.name}</h3><p className="text-sm text-muted-foreground mt-1 min-h-10">{item.description}</p><p className="text-xs font-medium text-primary mt-3">{invoiceTemplateRegistry.filter(template=>template.category===item.id).length} design{invoiceTemplateRegistry.filter(template=>template.category===item.id).length===1?'':'s'}</p>
        </button>)}</div></div>
      </div> : <div className="space-y-4">
        <div className="flex flex-wrap gap-2"><Badge>{getDocumentTitle(documentType)}</Badge><Badge variant="outline">{selectedCategory.name}</Badge></div>
        <div className="flex flex-col md:flex-row gap-2">
          <Button variant="ghost" onClick={()=>setStep('category')}><ArrowLeft className="h-4 w-4"/> Categories</Button>
          <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates, styles or industries"/></div>
          <Select value={sort} onValueChange={setSort}><SelectTrigger className="md:w-40"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="recommended">Recommended</SelectItem><SelectItem value="popular">Popular</SelectItem><SelectItem value="name">Name</SelectItem></SelectContent></Select>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Document type">
          {creationDocumentTypes.map(id => <Button key={id} type="button" size="sm" variant={documentType===id?'default':'outline'} className="shrink-0 rounded-full" role="tab" aria-selected={documentType===id} onClick={()=>setDocumentType(id)}>{documentTypes.find(item=>item.id===id)?.name}</Button>)}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template=><article key={template.slug} className="rounded-xl border overflow-hidden bg-card group">
            <div className={cn('h-52 py-2 bg-muted/40 relative overflow-hidden',template.layout==='modern'&&'bg-gradient-to-br from-primary/15 to-background')}>
              <InvoiceDocument templateSlug={template.slug} data={previewData} scale={0.18}/>
              <Badge variant="secondary" className="absolute bottom-2 left-2 max-w-[85%] truncate">{getDocumentTitle(documentType)} · {selectedCategory.name}</Badge>
              <button aria-label="Favourite template" onClick={()=>toggleFavourite(template.slug)} className="absolute top-2 right-2 bg-background rounded-full p-2 shadow"><Heart className={cn('h-4 w-4',favourites.includes(template.slug)&&'fill-red-500 text-red-500')}/></button>
            </div>
            <div className="p-4"><div className="flex items-center justify-between"><h3 className="font-semibold">{template.name}</h3>{template.recommended&&<Sparkles className="h-4 w-4 text-primary"/>}</div><p className="text-xs text-muted-foreground mt-1">{template.styleVariant} · {template.colorScheme} · v{template.version}</p><div className="flex gap-2 mt-4"><Button variant="outline" className="flex-1" onClick={()=>setPreview(template.slug)}><Eye className="h-4 w-4"/> Preview</Button><Button className="flex-1" onClick={()=>useTemplate(template.slug)}>Use Template</Button></div></div>
          </article>)}
        </div>
      </div>}
      {preview && <div className="fixed inset-0 z-[80] bg-black/75 p-2 md:p-8" onClick={()=>setPreview(undefined)}><div className="bg-background max-w-5xl h-full mx-auto rounded-xl p-4 md:p-6 overflow-auto" onClick={e=>e.stopPropagation()}><div className="flex justify-between sticky top-0 z-10 bg-background pb-4"><div><Badge><Star className="h-3 w-3 mr-1"/>A4 live preview</Badge><h2 className="text-2xl font-bold mt-2">{invoiceTemplateRegistry.find(t=>t.slug===preview)?.name} · {getDocumentTitle(documentType)}</h2></div><Button variant="outline" onClick={()=>setPreview(undefined)}>Close</Button></div><div className="overflow-auto py-4"><InvoiceDocument templateSlug={preview} data={{...sampleInvoiceData,documentTitle:getDocumentTitle(documentType)}} scale={0.72}/></div><Button className="mt-6 w-full" onClick={()=>useTemplate(preview)}>Use this template</Button></div></div>}
    </DialogContent>
  </Dialog>;
}
