import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ArrowRight, CheckCircle2 } from "@/lib/icons";

type PageContent = {
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  sections: Array<{ title: string; text: string; points: string[] }>;
  faq: Array<{ question: string; answer: string }>;
  links: Array<{ label: string; href: string }>;
};

export const publicFeaturePages: Record<string, PageContent> = {
  features: {
    title: "Invoice Features for Small Businesses",
    eyebrow: "IEOSUIA Invoices features",
    description: "Explore invoicing, quotes, saved clients, products and services, payment tracking, PDF documents and reports in IEOSUIA Invoices.",
    intro: "Keep the practical parts of invoicing connected: the client, the work, the document, the payment status and the reporting record.",
    sections: [
      { title: "Create professional business documents", text: "Choose the appropriate document type instead of renaming a generic invoice.", points: ["Invoices and VAT invoices", "Quotes and estimates", "Receipts, credit notes and debit notes"] },
      { title: "Reuse accurate business details", text: "Save information that appears repeatedly so each new document starts with consistent records.", points: ["Client contact and billing details", "Products and services", "Business branding and payment information"] },
      { title: "Follow the payment position", text: "Issued invoices can move through meaningful payment states while preserving payment history.", points: ["Pending and overdue status", "Full and partial payments", "Paid and outstanding balances"] },
    ],
    faq: [{ question: "What documents can I create?", answer: "IEOSUIA Invoices supports invoices, quotes, receipts, credit notes, debit notes and other available invoice formats." }, { question: "Can I download documents?", answer: "Yes. Supported documents can be generated as professional PDFs for download or printing." }],
    links: [{ label: "Explore online invoicing", href: "/invoicing" }, { label: "Learn about payment tracking", href: "/payment-tracking" }, { label: "Browse documentation", href: "/documentation" }],
  },
  invoicing: {
    title: "Online Invoice Software for South African Businesses",
    eyebrow: "Create invoices online",
    description: "Create professional invoices in ZAR, reuse client and line-item details, track payment status and download invoice PDFs with IEOSUIA Invoices.",
    intro: "IEOSUIA Invoices gives South African freelancers and small businesses a clear workflow for preparing, issuing and tracking professional invoices online.",
    sections: [
      { title: "Build the invoice from reliable records", text: "Select a saved client, add products or services, and review dates and payment terms before issuing.", points: ["Business and client details", "Quantities, rates and line totals", "Due dates, notes and payment instructions"] },
      { title: "Handle totals and VAT visibly", text: "Where VAT applies, show the tax calculation alongside subtotal and total rather than hiding it in the final figure.", points: ["Subtotal and VAT presentation", "ZAR and supported currencies", "Accurate total and outstanding balance"] },
      { title: "Produce a usable document", text: "Preview the invoice, finalize it when ready and download a polished PDF to send through your preferred channel.", points: ["Draft and issued workflows", "Professional document designs", "PDF download and print"] },
    ],
    faq: [{ question: "Can I create an invoice online?", answer: "Yes. Add or select a client, add invoice items and dates, choose a design, then save or issue the invoice." }, { question: "Does IEOSUIA Invoices support VAT?", answer: "The invoice workflow supports VAT fields and VAT totals. You remain responsible for using the correct tax treatment for your business." }],
    links: [{ label: "Manage saved clients", href: "/client-management" }, { label: "Save products and services", href: "/products-and-services" }, { label: "Create an Invoice Free", href: "/register" }],
  },
  quotes: {
    title: "Create Professional Quotes Online",
    eyebrow: "Quotes and estimates",
    description: "Prepare professional quotes using saved clients, products and services, with quote-specific numbering and PDF output.",
    intro: "Create a quotation before work begins without presenting it as an issued invoice. Quote-specific labels and numbering keep the purpose clear.",
    sections: [
      { title: "Start with the customer and scope", text: "Use saved client details and describe the proposed products or services clearly.", points: ["Reusable client records", "Item descriptions, quantities and rates", "Quote dates and validity details"] },
      { title: "Keep the document type accurate", text: "A quote uses its own terminology and number sequence rather than an invoice number with a changed heading.", points: ["Quote-specific document title", "Dedicated number sequence", "Appropriate draft workflow"] },
      { title: "Share a professional PDF", text: "Review the quote in the selected design and download a PDF for the client.", points: ["Document preview", "Business branding", "PDF download and print"] },
    ],
    faq: [{ question: "Can I create quotations?", answer: "Yes. Quote and estimate documents are available with their own document type and numbering." }, { question: "Is a quote recorded as a paid invoice?", answer: "No. A quote is a separate document and does not represent an invoice payment." }],
    links: [{ label: "Explore invoice creation", href: "/invoicing" }, { label: "See saved products and services", href: "/products-and-services" }, { label: "Read the FAQ", href: "/faq" }],
  },
  "payment-tracking": {
    title: "Invoice Payment Tracking",
    eyebrow: "Paid, partial and outstanding",
    description: "Track pending, partially paid, paid and overdue invoices, record payment dates and keep outstanding balances visible.",
    intro: "See the current payment position without replacing the original invoice amount or losing the individual payment records behind the balance.",
    sections: [
      { title: "Record payments with dates", text: "Each payment record contributes to the paid amount and leaves a clear date in payment history.", points: ["Full and partial payments", "Payment dates", "Editable and voidable payment records"] },
      { title: "Keep balances synchronized", text: "Paid and outstanding totals update from the active payment history and linked transaction adjustments.", points: ["Amount paid", "Outstanding balance", "Client-level outstanding totals"] },
      { title: "Identify overdue invoices", text: "An issued invoice that passes its due date without being fully paid is shown as overdue.", points: ["Pending before the due date", "Overdue after the due date", "Dashboard and invoice filters"] },
    ],
    faq: [{ question: "Can I record a partial payment?", answer: "Yes. A partial payment updates the amount paid and the remaining outstanding balance." }, { question: "When is an invoice overdue?", answer: "An issued invoice becomes overdue when its due date has passed and it has not been fully paid." }],
    links: [{ label: "Explore invoicing", href: "/invoicing" }, { label: "Review reporting", href: "/reports" }, { label: "Get Started Free", href: "/register" }],
  },
  "client-management": {
    title: "Client Management for Invoicing",
    eyebrow: "Reusable customer details",
    description: "Save client contact and billing details, reuse them in business documents and keep each client's transaction history connected.",
    intro: "Avoid re-entering the same customer details on every document. A saved client record keeps contact details and related documents together.",
    sections: [
      { title: "Save the details documents need", text: "Record the contact and billing information that should carry into invoices, quotes and receipts.", points: ["Client or business name", "Email, phone and address", "Billing details"] },
      { title: "Create documents from the client record", text: "Select the client during document creation so the relevant information is filled consistently.", points: ["Invoices and quotes", "Credit and debit notes", "Receipts"] },
      { title: "Review connected activity", text: "Use the client record and invoice view to understand related documents and outstanding balances.", points: ["Document history", "Related transaction documents", "Current outstanding amount"] },
    ],
    faq: [{ question: "Can I save clients?", answer: "Yes. Client records can store reusable contact and billing details." }, { question: "Do saved clients connect to invoices?", answer: "Yes. Documents remain associated with the selected client for history and balance reporting." }],
    links: [{ label: "Create invoices online", href: "/invoicing" }, { label: "Manage products and services", href: "/products-and-services" }, { label: "Browse features", href: "/features" }],
  },
  "products-and-services": {
    title: "Reusable Products and Services for Invoices",
    eyebrow: "Faster line-item entry",
    description: "Save products and services with descriptions, prices and applicable tax details for reuse on invoices and quotes.",
    intro: "Create reusable catalogue records for the work or goods you invoice regularly, then select them instead of typing the same information again.",
    sections: [
      { title: "Store useful item information", text: "Keep the standard information needed when the item appears on a document.", points: ["Product or service name", "Description and reference code", "Unit price and applicable tax"] },
      { title: "Reuse items on documents", text: "Select saved products or services while preparing invoices and quotes, then adjust document-specific quantities where needed.", points: ["Consistent descriptions", "Reusable pricing", "Quantity and line totals"] },
      { title: "Keep client and item workflows connected", text: "Combine a saved client with saved items to prepare documents with fewer repeated fields.", points: ["Invoice creation", "Quote creation", "Clear line-item records"] },
    ],
    faq: [{ question: "Can I save services as well as products?", answer: "Yes. The catalogue supports reusable products and services." }, { question: "Can I adjust an item on a document?", answer: "Document creation allows the relevant quantity and item information to be set for that transaction." }],
    links: [{ label: "Explore client management", href: "/client-management" }, { label: "Create professional quotes", href: "/quotes" }, { label: "Create an Invoice Free", href: "/register" }],
  },
  reports: {
    title: "Invoice Reports and Business Activity",
    eyebrow: "Review invoicing performance",
    description: "Review invoiced, paid and outstanding activity using date and period filters across IEOSUIA Invoices reports and analytics.",
    intro: "Use reporting periods to review the same invoicing records from a business perspective, without presenting the reports as a complete accounting system.",
    sections: [
      { title: "Choose the period that matters", text: "Filter report information by available monthly, quarterly, yearly or custom date ranges.", points: ["Month and year selection", "Quarterly and yearly views", "Custom date ranges"] },
      { title: "Review invoice activity", text: "Compare issued documents, collections and outstanding balances for the selected period.", points: ["Invoiced totals", "Paid and outstanding figures", "Invoice status information"] },
      { title: "Export supported reports", text: "Use the available report exports when you need a portable business record.", points: ["PDF reports", "CSV and text exports where available", "Consistent document numbers"] },
    ],
    faq: [{ question: "Is reporting the same as accounting?", answer: "No. Reports summarize invoicing activity. Broader accounting functionality is still planned." }, { question: "Can I select a reporting period?", answer: "Yes. Available selectors include monthly, quarterly, yearly and custom date ranges." }],
    links: [{ label: "Learn about payment tracking", href: "/payment-tracking" }, { label: "Accounting roadmap", href: "/accounting" }, { label: "Browse documentation", href: "/documentation" }],
  },
  accounting: {
    title: "Accounting — Coming Soon",
    eyebrow: "Product roadmap",
    description: "Invoices today. Accounting next. Learn how IEOSUIA Invoices distinguishes current invoicing tools from planned accounting capabilities.",
    intro: "IEOSUIA Invoices currently focuses on business documents, clients, products and services, payment tracking and invoicing reports. Broader accounting functionality is planned, not currently available.",
    sections: [
      { title: "Available today", text: "Use the live invoicing workspace for the document and payment workflows it currently supports.", points: ["Invoices, quotes and supported documents", "Clients, products and services", "Payment tracking and invoicing reports"] },
      { title: "Planned for the future", text: "Accounting is a roadmap direction. Undefined accounting capabilities are not being presented as live features.", points: ["No claim of a live accounting ledger", "No tax or SARS compliance guarantee", "No fabricated accounting screenshots"] },
      { title: "Use the right records today", text: "Current reports can help review invoice activity but should not be confused with a complete accounting platform.", points: ["Track invoice balances", "Review payment status", "Export supported invoicing records"] },
    ],
    faq: [{ question: "Is accounting available now?", answer: "No. Broader accounting functionality is planned and marked as Coming Soon." }, { question: "What can I use now?", answer: "The current product supports invoicing, quotes and other supported documents, saved business records, payment tracking and invoicing reports." }],
    links: [{ label: "Explore current features", href: "/features" }, { label: "Review invoice reports", href: "/reports" }, { label: "Get Started Free", href: "/register" }],
  },
};

const setMeta = (selector: string, attribute: string, value: string) => document.querySelector(selector)?.setAttribute(attribute, value);

const PublicFeaturePage = () => {
  const slug = useLocation().pathname.replace(/^\//, "");
  const page = publicFeaturePages[slug] || publicFeaturePages.features;
  const canonical = `https://invoices.ieosuia.com/${slug}`;

  useEffect(() => {
    document.title = `${page.title} | IEOSUIA Invoices`;
    setMeta('meta[name="description"]', "content", page.description);
    setMeta('link[rel="canonical"]', "href", canonical);
    setMeta('meta[property="og:title"]', "content", `${page.title} | IEOSUIA Invoices`);
    setMeta('meta[property="og:description"]', "content", page.description);
    setMeta('meta[property="og:url"]', "content", canonical);
  }, [canonical, page]);

  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", name: page.title, description: page.description, url: canonical, isPartOf: { "@id": "https://invoices.ieosuia.com/#website" } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://invoices.ieosuia.com/" }, { "@type": "ListItem", position: 2, name: page.title, item: canonical }] },
    { "@type": "FAQPage", mainEntity: page.faq.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
  ] };

  return <div className="min-h-screen bg-background"><Navbar /><main>
    <section className="bg-primary pb-16 pt-28 text-primary-foreground"><div className="container mx-auto px-4"><nav aria-label="Breadcrumb" className="mb-8 text-sm text-white/70"><Link to="/" className="hover:text-white">Home</Link><span aria-hidden="true" className="mx-2">/</span><span aria-current="page">{page.title}</span></nav><p className="text-sm font-bold uppercase tracking-[.2em] text-accent">{page.eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">{page.title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">{page.intro}</p><Link to="/register" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground">Get Started Free <ArrowRight className="h-5 w-5" /></Link></div></section>
    <section className="container mx-auto grid gap-6 px-4 py-16 lg:grid-cols-3">{page.sections.map(section => <article key={section.title} className="rounded-2xl border bg-card p-6 shadow-sm"><h2 className="text-2xl font-bold">{section.title}</h2><p className="mt-4 leading-7 text-muted-foreground">{section.text}</p><ul className="mt-6 space-y-3">{section.points.map(point => <li key={point} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />{point}</li>)}</ul></article>)}</section>
    <section className="bg-muted/40 py-16"><div className="container mx-auto max-w-4xl px-4"><h2 className="text-3xl font-bold">Common questions</h2><div className="mt-8 space-y-4">{page.faq.map(item => <article key={item.question} className="rounded-xl border bg-card p-6"><h3 className="text-lg font-bold">{item.question}</h3><p className="mt-2 leading-7 text-muted-foreground">{item.answer}</p></article>)}</div></div></section>
    <section className="container mx-auto px-4 py-16"><h2 className="text-2xl font-bold">Continue exploring</h2><div className="mt-6 flex flex-wrap gap-3">{page.links.map(link => <Link key={link.href} to={link.href} className="inline-flex items-center gap-2 rounded-xl border bg-card px-5 py-3 font-semibold hover:border-accent">{link.label}<ArrowRight className="h-4 w-4" /></Link>)}</div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  </main><Footer /></div>;
};

export default PublicFeaturePage;
