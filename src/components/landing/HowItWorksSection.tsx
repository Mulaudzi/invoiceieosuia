import { Link } from "react-router-dom";
import { ArrowRight, Building2, FileText, TrendingUp, Users } from "@/lib/icons";

const steps = [
  [Building2, "Set up your business", "Add the identity and payment details used on your documents."],
  [Users, "Save your client", "Keep contact and billing information ready for the next transaction."],
  [FileText, "Create the document", "Choose the document type, design, items, dates and terms."],
  [TrendingUp, "Issue and track", "Download the PDF, record payments and monitor the balance."],
] as const;

const HowItWorksSection = () => (
  <section id="how-it-works" className="bg-white py-20 lg:py-28">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl"><p className="landing-kicker">One connected workflow</p><h2 className="landing-title">From business details to a settled balance.</h2></div>
      <ol className="relative mt-14 grid gap-5 lg:grid-cols-4 before:absolute before:left-[12%] before:right-[12%] before:top-8 before:hidden before:h-px before:bg-emerald-900/15 lg:before:block">
        {steps.map(([Icon,title,description],index) => <li key={title} className="relative rounded-2xl border border-slate-200 bg-[#fafcfb] p-6"><div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0d3b31] text-white shadow-lg"><Icon className="h-6 w-6" /></div><p className="mt-7 text-xs font-bold uppercase tracking-wider text-emerald-700">Step {index+1}</p><h3 className="mt-2 text-xl font-bold text-slate-950">{title}</h3><p className="mt-3 leading-7 text-slate-600">{description}</p></li>)}
      </ol>
      <div className="mt-20 overflow-hidden rounded-[2rem] bg-[#103d33] px-6 py-12 text-center text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:text-left"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-emerald-300">Ready to create?</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Make your next document clearer.</h2><p className="mt-3 text-emerald-50/75">Start with the tools available in IEOSUIA Invoices today.</p></div><Link to="/register" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 py-3 font-bold text-[#08251f] lg:mt-0">Get Started Free <ArrowRight className="h-5 w-5" /></Link></div>
    </div>
  </section>
);

export default HowItWorksSection;
