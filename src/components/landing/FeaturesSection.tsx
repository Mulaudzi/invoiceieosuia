import { BarChart3, CheckCircle2, CreditCard, FileText, Package, Quote, Users } from "@/lib/icons";

const documents = [
  [FileText, "Invoice", "INV-0042", "Partially paid"],
  [Quote, "Quote", "QUO-0018", "Draft"],
  [FileText, "Credit note", "CN-0007", "Applied"],
  [FileText, "Receipt", "REC-0031", "Paid"],
] as const;

const FeaturesSection = () => (
  <div id="features" className="overflow-hidden bg-[#f7faf9]">
    <section id="documents" className="container mx-auto grid gap-12 px-4 py-20 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:py-28">
      <div className="max-w-xl"><p className="landing-kicker">Professional documents</p><h2 className="landing-title">More than an invoice with a different heading.</h2><p className="landing-copy">Create invoices, quotes, credit notes and receipts with distinct numbering, terminology and document details. Keep related documents connected to the original transaction.</p><ul className="mt-7 space-y-3 text-slate-700">{["Document-specific numbers and status", "Professional PDF output", "Linked transaction history"].map(item => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />{item}</li>)}</ul></div>
      <div className="grid gap-4 sm:grid-cols-2">{documents.map(([Icon,type,number,status]) => <article key={type} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_15px_45px_rgba(15,23,42,.06)]"><div className="flex items-start justify-between"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Icon className="h-5 w-5" /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{status}</span></div><h3 className="mt-7 text-lg font-bold">{type}</h3><p className="mt-1 font-mono text-sm text-slate-500">{number}</p><div className="mt-5 h-1.5 rounded-full bg-slate-100"><div className="h-full w-2/3 rounded-full bg-emerald-400" /></div></article>)}</div>
    </section>

    <section className="border-y border-slate-200 bg-white"><div className="container mx-auto grid gap-12 px-4 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
      <div className="order-2 rounded-3xl bg-[#0b3028] p-5 text-white shadow-xl lg:order-1 sm:p-7"><div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-sm text-emerald-200">INV-2026-0042</p><h3 className="mt-1 text-xl font-bold">Payment activity</h3></div><CreditCard className="h-6 w-6 text-emerald-300" /></div><div className="grid grid-cols-2 gap-3 py-5 sm:grid-cols-3">{[["Invoice total","R 6 900.00"],["Paid","R 4 000.00"],["Outstanding","R 2 900.00"]].map(([label,value]) => <div key={label} className="rounded-xl bg-white/10 p-4"><p className="text-xs text-slate-300">{label}</p><p className="mt-2 font-bold">{value}</p></div>)}</div>{[["R 2 500.00","18 Sep 2026"],["R 1 500.00","29 Sep 2026"]].map(([amount,date]) => <div key={date} className="mt-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm text-slate-800"><span><strong>{amount}</strong><small className="ml-2 text-slate-500">{date}</small></span><span className="font-semibold text-emerald-700">Recorded</span></div>)}</div>
      <div className="order-1 max-w-xl lg:order-2 lg:pl-10"><p className="landing-kicker">Payment tracking</p><h2 className="landing-title">Know what was paid—and what is still due.</h2><p className="landing-copy">Record full or partial payments, see payment dates, and keep the outstanding balance accurate. Pending and overdue documents remain visible without changing the original transaction history.</p></div>
    </div></section>

    <section className="container mx-auto grid gap-12 px-4 py-20 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:py-28">
      <div className="max-w-xl"><p className="landing-kicker">Clients, products and services</p><h2 className="landing-title">Keep the details you reuse close at hand.</h2><p className="landing-copy">Save client contact and billing details alongside reusable products and services. Use the same reliable records when creating the next document.</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><article className="landing-record-card"><div className="flex items-center gap-3"><span className="rounded-xl bg-violet-50 p-3 text-violet-700"><Users /></span><div><p className="landing-card-label">Client</p><h3 className="font-bold">Lumen Creative</h3></div></div><div className="landing-records"><p><span>Email</span>billing@lumen.demo</p><p><span>Documents</span>8 linked records</p><p><span>Outstanding</span><strong>R 2 900.00</strong></p></div></article><article className="landing-record-card sm:translate-y-8"><div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Package /></span><div><p className="landing-card-label">Service</p><h3 className="font-bold">Monthly retainer</h3></div></div><div className="landing-records"><p><span>Code</span>SERVICE-001</p><p><span>Unit price</span>R 4 800.00</p><p><span>Tax</span>15% VAT</p></div></article></div>
    </section>

    <section className="border-t border-slate-200 bg-[#eef7f3]"><div className="container mx-auto grid gap-12 px-4 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
      <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-xl sm:p-7"><div className="flex items-center justify-between"><div><p className="landing-card-label">This month</p><h3 className="mt-1 text-xl font-bold">Business overview</h3></div><BarChart3 className="text-emerald-700" /></div><div className="mt-6 grid grid-cols-2 gap-3">{[["Collected","R 38 450.00"],["Outstanding","R 9 250.00"]].map(([label,value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-lg font-bold sm:text-xl">{value}</p></div>)}</div><div className="mt-6 flex h-44 items-end gap-3 border-b border-slate-200 px-2">{[35,58,48,76,62,89,72].map((height,index)=><div key={index} className="flex-1 rounded-t-md bg-emerald-500/80" style={{height:`${height}%`}} />)}</div></div>
      <div className="max-w-xl lg:pl-10"><p className="landing-kicker">Reports and analytics</p><h2 className="landing-title">See the numbers behind the documents.</h2><p className="landing-copy">Review invoice activity, collections and outstanding balances using selectable time periods. Keep dashboard, report and analytics views grounded in the same records.</p></div>
    </div></section>
  </div>
);

export default FeaturesSection;
