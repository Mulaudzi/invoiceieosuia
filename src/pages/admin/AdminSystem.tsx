import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/services/api';
import { getAdminToken, removeAdminToken } from '@/services/adminAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Building2, Calendar, CreditCard, FileText, ImageIcon, RefreshCw, Search, Server, Users } from '@/lib/icons';

const sections = [
  ['overview','Overview',Server],['events','Activity',RefreshCw],['users','Customers',Users],['clients','Clients',Users],['products','Products',Building2],['invoices','Invoices',FileText],['payments','Payments',CreditCard],['schedules','Schedules',Calendar],['uploads','Uploads',ImageIcon],['errors','Errors',AlertCircle],
] as const;
const money=(value:unknown)=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value)||0);
const date=(value:unknown)=>value?new Date(String(value)).toLocaleString('en-ZA'):'—';
const text=(value:unknown)=>value===null||value===undefined||value===''?'—':String(value);

export default function AdminSystem(){
  const [section,setSection]=useState('overview'); const [search,setSearch]=useState(''); const [data,setData]=useState<any>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const navigate=useNavigate();
  const load=async()=>{setLoading(true);setError('');try{const token=getAdminToken();if(!token){navigate('/guymhan/login');return;}const response=await api.get('/guymhan/system',{params:{section,search},headers:{Authorization:`Bearer ${token}`}});setData(response.data.data);}catch(error){if((error as any)?.response?.status===401){removeAdminToken();navigate('/guymhan/login');return;}setError(error instanceof Error?error.message:'System information could not be loaded. Please try again.');}finally{setLoading(false);}};
  useEffect(()=>{void load()},[section]);
  const rows=Array.isArray(data)?data:[];
  const cards=useMemo(()=>data&&!Array.isArray(data)?[
    ['Registered customers',data.users,Users],['Business profiles',data.businesses,Building2],['Invoices',data.invoices,FileText],['Outstanding',money(data.outstanding),CreditCard],['Payments received',money(data.paid),CreditCard],['Overdue invoices',data.overdue,AlertCircle],['Billing schedules',data.schedules,Calendar],['Uploaded files',data.uploads,ImageIcon]
  ]:[],[data]);
  const fields:Record<string,Array<[string,string,((v:any)=>string)?]>>={
    users:[['Customer','name'],['Email','email'],['Business','business_name'],['Invoices','invoice_count'],['Clients','client_count'],['Verified','email_verified_at',v=>v?'Yes':'No'],['Joined','created_at',date]],
    invoices:[['Invoice','invoice_number'],['Business','business_name'],['Customer','client_name'],['Type','document_type'],['Status','status'],['Total','total',money],['Paid','amount_paid',money],['Outstanding','balance_due',money],['Due','due_date',date]],
    payments:[['Invoice','invoice_number'],['Business','owner_name'],['Customer','client_name'],['Amount','amount',money],['Payment date','payment_date',date],['Reference','reference'],['State','voided_at',v=>v?'Voided':'Recorded']],
    schedules:[['Business','business_name'],['Customer','client_name'],['Description','description'],['Frequency','frequency'],['Status','status'],['Next billing','next_invoice_date',date],['Invoices','invoice_count'],['Total','total',money]],
    clients:[['Client','name'],['Email','email'],['Company','company'],['Business owner','business_name'],['Invoices','invoice_count'],['Invoiced','invoiced_total',money],['Status','status'],['Added','created_at',date]],
    products:[['Product','name'],['Business','business_name'],['Owner email','owner_email'],['Category','category'],['Price','price',money],['Tax rate','tax_rate',v=>`${Number(v)||0}%`],['Added','created_at',date]],
    events:[['Activity','type'],['Record','subject'],['Business','business'],['When','occurred_at',date]],
    uploads:[['File','name'],['Folder','folder'],['Type','type'],['Size','size',v=>`${(Number(v)/1024).toFixed(1)} KB`],['Updated','updated_at',date]],
    errors:[['Recent server message','message']],
  };
  const currentFields=fields[section]||[];
  return <AdminLayout><header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur"><div className="mx-auto max-w-7xl px-4 py-4 sm:px-6"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Admin</p><h1 className="truncate text-2xl font-bold sm:text-3xl">System Operations</h1><p className="hidden text-sm text-muted-foreground sm:block">Monitor customers, documents, billing, files, and service health.</p></div><Button size="icon" variant="outline" onClick={load} aria-label="Refresh"><RefreshCw className={loading?'animate-spin':''}/></Button></div><nav className="mt-4 flex gap-2 overflow-x-auto pb-1">{sections.map(([id,label,Icon])=><Button key={id} size="sm" variant={section===id?'default':'outline'} className="shrink-0 rounded-full" onClick={()=>{setSection(id);setSearch('')}}><Icon className="mr-1 h-4 w-4"/>{label}</Button>)}</nav></div></header>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">{section!=='overview'&&<div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder={`Search ${sections.find(x=>x[0]===section)?.[1].toLowerCase()}…`} className="pl-9"/></div><Button onClick={load}>Search</Button></div>}
      {error&&<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><b>Information unavailable.</b><p>{error}</p></div>}
      {loading?<div className="grid min-h-64 place-items-center"><RefreshCw className="h-8 w-8 animate-spin text-primary"/></div>:section==='overview'?<><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label,value,Icon]:any)=><article key={label} className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"><Icon className="mb-5 h-6 w-6 text-primary"/><p className="text-xs text-muted-foreground sm:text-sm">{label}</p><p className="mt-1 break-words text-xl font-bold sm:text-2xl">{text(value)}</p></article>)}</div><div className="grid gap-4 lg:grid-cols-2"><Summary title="Recent customers" rows={data?.recent_users||[]} fields={fields.users.slice(0,4)}/><Summary title="Recent invoices" rows={data?.recent_invoices||[]} fields={fields.invoices.slice(0,5)}/></div></>:<DataView rows={rows} fields={currentFields}/>}</main>
  </AdminLayout>;
}

function Summary({title,rows,fields}:{title:string;rows:any[];fields:Array<[string,string,((v:any)=>string)?]>}){return <section className="rounded-2xl border bg-card p-4 sm:p-5"><h2 className="mb-3 font-semibold">{title}</h2><DataView rows={rows} fields={fields}/></section>}
function DataView({rows,fields}:{rows:any[];fields:Array<[string,string,((v:any)=>string)?]>}){if(!rows.length)return <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No records found.</div>;return <><div className="space-y-3 md:hidden">{rows.map((row,index)=><article key={row.id||index} className="rounded-2xl border bg-card p-4 shadow-sm">{fields.map(([label,key,formatter],i)=><div key={key} className={i===0?'mb-3 border-b pb-3':'flex justify-between gap-4 py-1.5 text-sm'}><span className={i===0?'font-semibold':'text-muted-foreground'}>{label}</span><span className="break-all text-right">{formatter?formatter(row[key]):text(row[key])}</span></div>)}</article>)}</div><div className="hidden overflow-x-auto rounded-xl border md:block"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted/60"><tr>{fields.map(([label])=><th key={label} className="whitespace-nowrap p-3 text-left font-medium">{label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={row.id||index} className="border-t">{fields.map(([label,key,formatter])=><td key={label} className="max-w-xs p-3 align-top"><span className="line-clamp-3 break-words">{formatter?formatter(row[key]):text(row[key])}</span></td>)}</tr>)}</tbody></table></div></>}
