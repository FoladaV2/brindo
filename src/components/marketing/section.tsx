import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A home page section: full-bleed wrapper, centred page-width content. */
export function Section({
  id,
  labelledBy,
  className,
  innerClassName,
  children,
}: {
  id?: string;
  labelledBy?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("scroll-mt-24 px-gutter-brand py-section-brand", className)}>
      <div className={cn("mx-auto max-w-page", innerClassName)}>{children}</div>
    </section>
  );
}

/** Eyebrow, headline and optional lead. Centred by default; `align="start"` for split layouts. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  align = "center",
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div className={cn("grid gap-5", align === "center" ? "mx-auto max-w-3xl justify-items-center text-center" : "justify-items-start", className)}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id} className="font-display text-title">
        {title}
      </h2>
      {lead ? <p className="max-w-xl text-lead text-muted-foreground">{lead}</p> : null}
    </div>
  );
}
