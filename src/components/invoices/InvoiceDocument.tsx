import { formatCurrency } from '@/lib/currencies';
import { cn } from '@/lib/utils';
import { usePrivateMediaUrl } from '@/hooks/usePrivateMediaUrl';

export interface InvoiceDocumentData {
  business:{ name:string; tradingName?:string; logo?:string; registration?:string; vatNumber?:string; address?:string; email?:string; phone?:string; website?:string };
  customer:{ name:string; company?:string; address?:string; email?:string; phone?:string; taxNumber?:string };
  invoiceNumber:string; date:string; dueDate:string; documentTitle?:string; reference?:string; currency:string;
  items:Array<{description:string; quantity:number; unitPrice:number; discount?:number; taxRate?:number}>;
  notes?:string; terms?:string; paymentDetails?:string; bankDetails?:Array<[string,string]>; footer?:string; paidAmount?:number; paymentHistory?:Array<{amount:number;paymentDate:string;reference?:string;voidedAt?:string}>;
}

export const sampleInvoiceData:InvoiceDocumentData = {
  business:{name:'IEOSUIA (Pty) Ltd',tradingName:'Digital business solutions',registration:'2026/123456/07',vatNumber:'4123456789',address:'45 Innovation Avenue, Johannesburg, South Africa',email:'accounts@example.co.za',phone:'+27 11 555 0142',website:'www.example.co.za'},
  customer:{name:'Thabo Mokoena',company:'Example Technologies (Pty) Ltd',address:'18 Market Street, Cape Town, 8001',email:'finance@example-client.co.za'},
  invoiceNumber:'INV-2026-001',date:'29 Aug 2026',dueDate:'12 Sep 2026',documentTitle:'INVOICE',reference:'WEB-2026-08',currency:'ZAR',
  items:[{description:'Website Development',quantity:1,unitPrice:15000,taxRate:15},{description:'UI/UX Design',quantity:1,unitPrice:5000,taxRate:15},{description:'Monthly Support',quantity:2,unitPrice:1500,discount:5,taxRate:15}],
  notes:'Thank you for your business.',terms:'Payment is due within 14 days.',bankDetails:[['Bank','Example Business Bank'],['Account','1234567890'],['Branch','250655']],footer:'Thank you for your business!',
};

const variants:Record<string,{primary:string;secondary:string;paper:string;ink:string;muted:string}> = {
  'general-corporate-blue':{primary:'#0756a0',secondary:'#e9f2fb',paper:'#fff',ink:'#14233a',muted:'#64748b'},
  'general-teal-modern':{primary:'#159489',secondary:'#e6f5f3',paper:'#fff',ink:'#172a2b',muted:'#617776'},
  'general-minimal-monochrome':{primary:'#151515',secondary:'#f1f1f1',paper:'#fff',ink:'#151515',muted:'#666'},
  'general-executive-navy-gold':{primary:'#f1c54c',secondary:'#0a243d',paper:'#061d32',ink:'#fff',muted:'#d6dfE7'},
  'general-blue-wave':{primary:'#0758a8',secondary:'#dceefa',paper:'#fff',ink:'#17263b',muted:'#68768a'},
  'general-purple-clean':{primary:'#613794',secondary:'#eee8f7',paper:'#fff',ink:'#202033',muted:'#716b7a'},
  'general-olive-corporate':{primary:'#53781e',secondary:'#eef2df',paper:'#fff',ink:'#202817',muted:'#6c7563'},
  'general-orange-creative':{primary:'#f05a00',secondary:'#fff0e6',paper:'#fff',ink:'#251d18',muted:'#776a61'},
  'general-red-professional':{primary:'#ce0808',secondary:'#fdeaea',paper:'#fff',ink:'#241b1b',muted:'#756767'},
  'general-warm-minimal':{primary:'#151515',secondary:'#ece8df',paper:'#fbf8f1',ink:'#171717',muted:'#736f68'},
};

const nonEmpty=(value:unknown)=>value!==undefined&&value!==null&&value!=='';

export function InvoiceDocument({templateSlug,data=sampleInvoiceData,scale=1,className,primaryColor,accentColor}:{templateSlug:string;data?:InvoiceDocumentData;scale?:number;className?:string;primaryColor?:string;accentColor?:string}) {
  const logoUrl=usePrivateMediaUrl(data.business.logo);
  const baseToken=variants[templateSlug] || variants['general-corporate-blue'];
  const token={...baseToken,primary:primaryColor||baseToken.primary,secondary:accentColor||baseToken.secondary};
  const lines=data.items.map(item=>{
    const gross=item.quantity*item.unitPrice; const discount=gross*(item.discount||0)/100; const net=gross-discount;
    return {...item,discountAmount:discount,net,tax:net*(item.taxRate||0)/100,total:net+net*(item.taxRate||0)/100};
  });
  const subtotal=lines.reduce((sum,item)=>sum+item.quantity*item.unitPrice,0);
  const discount=lines.reduce((sum,item)=>sum+item.discountAmount,0);
  const tax=lines.reduce((sum,item)=>sum+item.tax,0); const total=subtotal-discount+tax; const paid=data.paidAmount||0;
  const title=(data.documentTitle||'INVOICE').toUpperCase();
  const isCredit=title==='CREDIT NOTE'; const isDebit=title==='DEBIT NOTE'; const isReceipt=title==='RECEIPT';
  const recipientLabel=isCredit?'Credit To':isDebit?'Debit To':isReceipt?'Received From':'Bill To';
  const totalLabel=isCredit?'Total Credit':isDebit?'Total Debit':isReceipt?'Amount Received':'Total';
  const dark=templateSlug==='general-executive-navy-gold';
  const documentLabel=isCredit?'Credit Note':isDebit?'Debit Note':isReceipt?'Receipt':(data.documentTitle||'INVOICE').replace(' / ESTIMATE','').replace('TAX ','').replace('PRO FORMA ','').replace('FINAL ','').replace('COMMERCIAL ','').replace('INTERIM ','').replace('RECURRING ','').replace('DEPOSIT ','').replace('PROGRESS ','');
  return <div className={cn('invoice-preview-shell',className)} style={{width:`${210*scale}mm`,height:`${297*scale}mm`}}>
    <article className={cn('invoice-document',`invoice-${templateSlug}`)} style={{'--invoice-primary':token.primary,'--invoice-secondary':token.secondary,'--invoice-paper':token.paper,'--invoice-ink':token.ink,'--invoice-muted':token.muted,transform:`scale(${scale})`} as React.CSSProperties}>
      <div className="invoice-decoration" aria-hidden="true"><i/><i/><i/></div>
      <header className="invoice-doc-header">
        <section className="invoice-brand">
          {logoUrl ? <img src={logoUrl} alt={`${data.business.name} logo`}/> : <span className="invoice-logo-fallback" aria-hidden="true">{data.business.name.slice(0,2).toUpperCase()}</span>}
          <div><h1>{data.business.name}</h1>{data.business.tradingName&&<p>{data.business.tradingName}</p>}{data.business.registration&&<p>Registration: {data.business.registration}</p>}{data.business.vatNumber&&<p>VAT: {data.business.vatNumber}</p>}</div>
        </section>
        <h2>{data.documentTitle||'INVOICE'}</h2>
      </header>
      <section className="invoice-parties">
        <div className="invoice-bill-to"><h3>{recipientLabel}</h3><strong>{data.customer.name}</strong>{data.customer.company&&<span>{data.customer.company}</span>}{data.customer.address&&<span>{data.customer.address}</span>}{data.customer.email&&<span>{data.customer.email}</span>}{data.customer.phone&&<span>{data.customer.phone}</span>}</div>
        <dl className="invoice-meta"><div><dt>{documentLabel} No.</dt><dd>{data.invoiceNumber}</dd></div><div><dt>{isReceipt?'Payment Date':`${documentLabel} Date`}</dt><dd>{data.date}</dd></div>{!isCredit&&!isReceipt&&<div><dt>Due Date</dt><dd>{data.dueDate}</dd></div>}{data.reference&&<div><dt>Original Invoice</dt><dd>{data.reference}</dd></div>}</dl>
      </section>
      <table className="invoice-items"><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th>{discount>0&&<th>Discount</th>}<th>Amount</th></tr></thead><tbody>{lines.map((item,index)=><tr key={`${item.description}-${index}`}><td>{item.description}</td><td>{item.quantity}</td><td>{formatCurrency(item.unitPrice,data.currency)}</td>{discount>0&&<td>{item.discount||0}%</td>}<td>{formatCurrency(item.net,data.currency)}</td></tr>)}</tbody></table>
      <section className="invoice-summary">
        <div className="invoice-notes">{data.notes&&<div><h3>Notes</h3><p>{data.notes}</p></div>}{data.terms&&<div><h3>Terms</h3><p>{data.terms}</p></div>}{data.paymentHistory?.some(payment=>!payment.voidedAt)&&<div><h3>Payments Received</h3>{data.paymentHistory.filter(payment=>!payment.voidedAt).map(payment=><p key={`${payment.paymentDate}-${payment.amount}`}>{payment.paymentDate}: {formatCurrency(payment.amount,data.currency)}{payment.reference?` · ${payment.reference}`:''}</p>)}</div>}</div>
        <dl className="invoice-totals"><div><dt>{isReceipt?'Payment Subtotal':isCredit?'Credit Subtotal':isDebit?'Debit Subtotal':'Subtotal'}</dt><dd>{formatCurrency(subtotal,data.currency)}</dd></div>{discount>0&&<div><dt>Discount</dt><dd>-{formatCurrency(discount,data.currency)}</dd></div>}{tax>0&&<div><dt>Tax / VAT</dt><dd>{formatCurrency(tax,data.currency)}</dd></div>}<div className="invoice-grand-total"><dt>{totalLabel}</dt><dd>{formatCurrency(total,data.currency)}</dd></div>{paid>0&&!isReceipt&&!isCredit&&!isDebit&&<><div><dt>Paid</dt><dd>{formatCurrency(paid,data.currency)}</dd></div><div><dt>Balance Due</dt><dd>{formatCurrency(total-paid,data.currency)}</dd></div></>}{isReceipt&&<div><dt>Payment Status</dt><dd>Received</dd></div>}</dl>
      </section>
      <footer className="invoice-doc-footer">
        <div>{(data.bankDetails?.some(([,v])=>nonEmpty(v))||data.paymentDetails)&&<section className="invoice-payment"><h3>Payment Information</h3>{data.bankDetails?.filter(([,v])=>nonEmpty(v)).map(([label,value])=><p key={label}><b>{label}:</b> {value}</p>)}{data.paymentDetails&&<p className="invoice-payment-instructions">{data.paymentDetails}</p>}</section>}</div>
        <div className="invoice-contact">{[data.business.address,data.business.phone,data.business.email,data.business.website].filter(nonEmpty).map(value=><span key={value}>{value}</span>)}</div>
        <strong>{data.footer}</strong>
      </footer>
    </article>
  </div>;
}
