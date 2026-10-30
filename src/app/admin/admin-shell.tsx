import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Logo } from "@/components/brand/logo";
import { Toasts } from "@/components/toasts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const t = copy.admin;

export type AdminSection = "overview" | "users" | "results";

/** Every admin page: the header, the three sections as tabs, and the page underneath. */
export function AdminShell({ active, basePath = "/admin", children }: { active: AdminSection; basePath?: string; children: ReactNode }) {
  const sections: [AdminSection, string][] = [
    ["overview", basePath],
    ["users", `${basePath}/users`],
    ["results", `${basePath}/results`],
  ];
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-nav">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-gutter-brand">
          <div className="flex items-center gap-3">
            <Logo height={18} />
            <Badge variant="secondary">{t.badge}</Badge>
          </div>
          <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
            {t.back}
          </Link>
        </div>
        <nav aria-label={t.nav.label} className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-gutter-brand">
          {sections.map(([key, href]) => (
            <Link
              key={key}
              href={href}
              aria-current={key === active ? "page" : undefined}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-3 py-3 text-sm whitespace-nowrap",
                key === active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.nav[key]}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-8 px-gutter-brand pt-8 pb-20 sm:pt-12">{children}</main>
      <Toasts />
    </div>
  );
}

/** One big number with its label and a line of detail. */
export function Kpi({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <div className="grid content-start gap-1 rounded-xl border border-border bg-card p-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-display text-[clamp(2rem,1.7rem+1.2vw,2.75rem)] leading-tight tabular">{value}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  );
}

export function Panel({ title, lead, children, className }: { title: string; lead?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("grid content-start gap-5 rounded-xl border border-border bg-card p-5 sm:p-7", className)}>
      <div className="grid gap-1">
        <h2 className="font-display text-heading">{title}</h2>
        {lead ? <p className="text-sm text-muted-foreground">{lead}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** The page heading every admin section starts with. */
export function AdminHeading({ heading, lead, children }: { heading: string; lead: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        <h1 className="font-display text-title">{heading}</h1>
        <p className="max-w-xl text-muted-foreground">{lead}</p>
      </div>
      {children}
    </div>
  );
}

/** Shown when the admin functions a page needs aren't in the database yet. */
export function Unavailable({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="grid gap-2 rounded-xl border border-dashed border-border p-8">
      <h2 className="font-display text-heading">{heading}</h2>
      <p className="text-muted-foreground">{body}</p>
    </div>
  );
}
