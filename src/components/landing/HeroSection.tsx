import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "@/lib/icons";
import IEOSUIAInvoicesLogo from "@/components/branding/IEOSUIAInvoicesLogo";

const navigation = [
  [LayoutDashboard, "Dashboard", true],
  [FileText, "Invoices", false],
  [Users, "Clients", false],
  [Package, "Products & Services", false],
  [BarChart3, "Reports", false],
  [Settings, "Settings", false],
] as const;

const metrics = [
  ["Total invoices", "24", "12%", FileText, "text-cyan-700", "bg-cyan-50"],
  ["Outstanding", "R 12,450.00", "8%", Clock, "text-amber-700", "bg-amber-50"],
  ["Paid", "R 28,930.00", "18%", CheckCircle2, "text-emerald-700", "bg-emerald-50"],
  ["Clients", "16", "6%", Users, "text-blue-700", "bg-blue-50"],
] as const;

const invoices = [
  ["INV-2026-0042", "Northstar Studio", "02 Oct 2026", "R 6,900.00", "Partially paid", "bg-cyan-50 text-cyan-700"],
  ["INV-2026-0041", "Zenith Events", "30 Sep 2026", "R 3,500.00", "Paid", "bg-emerald-50 text-emerald-700"],
  ["INV-2026-0040", "Moyo Creations", "25 Sep 2026", "R 1,250.00", "Pending", "bg-amber-50 text-amber-700"],
  ["INV-2026-0039", "Kairo Tech", "22 Sep 2026", "R 4,800.00", "Overdue", "bg-red-50 text-red-700"],
] as const;

const benefits = [
  [Zap, "Save time", "Create documents in minutes"],
  [Users, "Stay organised", "Manage clients and products"],
  [TrendingUp, "Track payments", "See what is paid and pending"],
  [Shield, "Built for South Africa", "Designed for local businesses"],
] as const;

const DashboardPreview = () => (
  <div className="relative overflow-hidden rounded-[1.35rem] border border-white/20 bg-white shadow-[0_30px_90px_rgba(0,0,0,.38)]" aria-label="Illustrative IEOSUIA Invoices dashboard using demo data">
    <div className="absolute right-4 top-3 z-10 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Illustrative demo</div>
    <div className="grid min-h-[430px] grid-cols-[112px_1fr] sm:min-h-[510px] sm:grid-cols-[150px_1fr]">
      <aside className="bg-[#06352d] p-3 text-white sm:p-4">
        <IEOSUIAInvoicesLogo variant="light" size="sidebar" className="mb-5" />
        <div className="space-y-1.5">
          {navigation.map(([Icon, label, active]) => (
            <div key={label} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[9px] font-medium sm:text-[11px] ${active ? "bg-emerald-400/20 text-emerald-200" : "text-white/70"}`}>
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>
      </aside>
      <div className="min-w-0 bg-[#f7faf9]">
        <div className="flex h-12 items-center justify-between border-b bg-white px-3 sm:px-5">
          <div className="flex w-2/3 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-[9px] text-slate-400 sm:text-[10px]"><Search className="h-3 w-3" />Search invoices, clients…</div>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0d5c4c] text-[9px] font-bold text-white">LM</span>
        </div>
        <div className="p-3 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-base font-bold text-slate-900 sm:text-xl">Good morning, Lufuno</p><p className="mt-1 hidden text-[10px] text-slate-500 sm:block">Here’s what’s happening with your business today.</p></div>
            <div className="hidden rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-bold text-[#062d25] sm:block">+ Create invoice</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {metrics.map(([label, value, change, Icon, iconColour, iconBackground]) => (
              <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
                <div className="flex items-start justify-between gap-1"><p className="truncate text-[8px] text-slate-500 sm:text-[10px]">{label}</p><span className={`rounded-md p-1 ${iconBackground} ${iconColour}`}><Icon className="h-3 w-3" /></span></div>
                <p className="mt-1 truncate text-[11px] font-bold text-slate-900 sm:text-sm">{value}</p>
                <p className="mt-1 text-[8px] font-semibold text-emerald-600">↑ {change}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white sm:mt-4">
            <div className="flex items-center justify-between border-b px-3 py-2.5"><p className="text-[11px] font-bold text-slate-900 sm:text-sm">Recent invoices</p><span className="text-[8px] font-semibold text-emerald-700">View all →</span></div>
            <div className="hidden grid-cols-[1.1fr_1fr_.8fr_.8fr_.8fr] gap-2 bg-slate-50 px-3 py-2 text-[8px] font-semibold uppercase text-slate-400 sm:grid"><span>Invoice</span><span>Client</span><span>Date</span><span>Amount</span><span>Status</span></div>
            {invoices.map(([number, client, date, amount, status, badge]) => (
              <div key={number} className="grid grid-cols-[1fr_auto] gap-2 border-t border-slate-100 px-3 py-2 text-[8px] text-slate-600 sm:grid-cols-[1.1fr_1fr_.8fr_.8fr_.8fr] sm:text-[9px]">
                <span className="font-semibold text-slate-800">{number}</span><span className="hidden truncate sm:block">{client}</span><span className="hidden sm:block">{date}</span><span className="hidden font-semibold sm:block">{amount}</span><span className={`justify-self-end rounded-full px-2 py-0.5 font-semibold sm:justify-self-start ${badge}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const MobileInvoicePreview = () => (
  <div className="relative mx-auto w-[210px] rounded-[2rem] border-[7px] border-[#071713] bg-white p-3 text-slate-900 shadow-[0_25px_60px_rgba(0,0,0,.45)] xl:absolute xl:-bottom-5 xl:-right-12 xl:w-[220px]" aria-label="Illustrative mobile invoice using demo data">
    <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-900" />
    <IEOSUIAInvoicesLogo variant="standard" size="mobile" className="mx-auto !h-5" />
    <div className="mt-4 flex items-start justify-between"><div><p className="text-xl font-black text-[#06352d]">INVOICE</p><p className="text-[8px] text-slate-500">INV-2026-0042</p></div><span className="rounded-full bg-emerald-100 px-2 py-1 text-[8px] font-bold text-emerald-700">PAID</span></div>
    <div className="mt-4 border-y py-3 text-[8px]"><p className="font-bold">Bill to: Zenith Events</p><div className="mt-2 flex justify-between text-slate-500"><span>Issued 02 Oct 2026</span><span>Due 16 Oct 2026</span></div></div>
    <div className="space-y-2 py-3 text-[8px]"><div className="flex justify-between"><span>Event setup</span><b>R 2,000.00</b></div><div className="flex justify-between"><span>Brand support</span><b>R 1,500.00</b></div></div>
    <div className="flex justify-between rounded-lg bg-emerald-50 px-2 py-2 text-[10px] font-bold"><span>Total</span><span>R 4,025.00</span></div>
    <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-[#06352d] py-2 text-[9px] font-bold text-white"><Download className="h-3 w-3" />Download PDF</div>
    <p className="mt-2 text-center text-[7px] uppercase tracking-wider text-slate-400">Illustrative demo</p>
  </div>
);

const HeroSection = () => (
  <section id="product" className="relative overflow-hidden bg-[#032d26] pb-0 pt-24 text-white lg:pt-28">
    <div className="absolute inset-0 [background:radial-gradient(circle_at_72%_28%,rgba(18,205,165,.24),transparent_32%),linear-gradient(135deg,#021f1b_0%,#063b32_58%,#032a24_100%)]" />
    <div className="absolute -bottom-40 -left-24 h-72 w-[55%] rounded-[50%] border-t border-emerald-300/20 bg-emerald-400/5" aria-hidden="true" />
    <div className="container relative mx-auto grid min-w-0 gap-12 px-4 pb-14 lg:grid-cols-[.78fr_1.22fr] lg:items-center lg:gap-9 lg:pb-16 xl:grid-cols-[.82fr_1.18fr]">
      <div className="min-w-0 max-w-2xl">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-[#0b4439]/70 px-4 py-2 text-sm font-semibold text-emerald-200"><FileText className="h-4 w-4" />Invoicing built for real business</p>
        <h1 className="text-[2.8rem] font-black leading-[.98] tracking-[-.055em] min-[390px]:text-5xl sm:text-6xl lg:text-[4.25rem] xl:text-[4.8rem]">Create. Send.<br /><span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">Track. Get paid.</span></h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-slate-200">Create professional invoices and business documents, download polished PDFs, and keep every client, payment and balance connected — all in one simple platform.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 font-bold text-[#042b24] shadow-[0_16px_40px_rgba(16,185,129,.25)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300">Create an Invoice Free <ArrowRight className="h-5 w-5" /></Link>
          <a href="#features" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Explore the Platform <ArrowRight className="h-4 w-4" /></a>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">{["Invoices and quotes", "Payment tracking", "PDF downloads"].map(item => <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" />{item}</span>)}</div>
      </div>
      <div className="relative mx-auto min-w-0 w-full max-w-[850px]">
        <div className="absolute -inset-8 rounded-[3rem] bg-emerald-300/10 blur-3xl" aria-hidden="true" />
        <DashboardPreview />
        <div className="mt-6 xl:mt-0"><MobileInvoicePreview /></div>
      </div>
    </div>
    <div className="relative border-t border-white/10 bg-black/10">
      <div className="container mx-auto grid grid-cols-1 divide-y divide-white/10 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {benefits.map(([Icon, title, description]) => <div key={title} className="flex items-center gap-4 px-4 py-5 sm:px-6"><Icon className="h-7 w-7 shrink-0 text-cyan-300" aria-hidden="true" /><div><p className="font-bold">{title}</p><p className="mt-0.5 text-sm text-slate-300">{description}</p></div></div>)}
      </div>
    </div>
  </section>
);

export default HeroSection;
