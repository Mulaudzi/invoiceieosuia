import { Link } from "react-router-dom";
import { BookOpen, Sparkles } from "@/lib/icons";

const AccountingComingSoonSection = () => (
  <section id="accounting" className="bg-muted/30 py-8" aria-labelledby="accounting-title">
    <div className="container mx-auto px-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
          <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Product roadmap
          </div>
          <h2 id="accounting-title" className="text-xl font-bold sm:text-2xl">
            Accounting <span className="text-accent">— Coming Soon</span>
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
            Invoices today. Accounting next. Broader accounting capabilities are planned and are not yet available.
          </p>
        </div>
        <Link to="/accounting" className="shrink-0 text-sm font-semibold text-primary hover:text-accent">
          View roadmap
        </Link>
      </div>
    </div>
  </section>
);

export default AccountingComingSoonSection;
