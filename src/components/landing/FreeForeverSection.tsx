import { CheckCircle2, Infinity as InfinityIcon, Sparkles } from "@/lib/icons";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const included = [
  "Unlimited invoices and clients",
  "Professional invoice templates",
  "Recurring invoices",
  "Reports, analytics, and exports",
  "PDF downloads and data exports",
  "All future core invoicing features",
];

const FreeForeverSection = () => (
  <section id="free" className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30 py-20">
    <div className="container relative mx-auto px-4">
      <div className="mx-auto max-w-4xl rounded-3xl border bg-card p-8 shadow-xl md:p-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <InfinityIcon className="h-9 w-9 text-accent" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
            <Sparkles className="h-4 w-4" />
            One account. Every feature.
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Free.</h2>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Create an account and use the complete IEOSUIA invoicing workspace for as long as you need. No tiers, trials, or locked features.
          </p>
        </div>

        <div className="my-10 grid gap-4 sm:grid-cols-2">
          {included.map((feature) => (
            <div key={feature} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
              <span className="font-medium text-foreground">{feature}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/register">
            <Button variant="accent" size="lg" className="px-10 shadow-glow">Create your free account</Button>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">The complete invoicing workspace, free.</p>
        </div>
      </div>
    </div>
  </section>
);

export default FreeForeverSection;
