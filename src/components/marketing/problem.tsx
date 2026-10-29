import { Check, X } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Reveal } from "@/templates/ui/Reveal";
import { Section, SectionHeading } from "./section";

const t = copy.home.problem;

/** The old way (scattered messages, unknown numbers) against one link and one list. */
export function Problem() {
  return (
    <Section labelledBy="problem-title">
      <SectionHeading id="problem-title" eyebrow={t.eyebrow} title={t.heading} />
      <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:mt-20 md:grid-cols-2 md:gap-6">
        <Reveal className="rounded-xl bg-sunken p-7 md:p-10">
          <h3 className="mb-6 text-sm font-medium text-muted-foreground">{t.old.title}</h3>
          <ul className="grid gap-4">
            {t.old.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground">
                <X className="mt-1 size-4 shrink-0 opacity-60" strokeWidth={2} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={90} className="rounded-xl border border-primary/25 bg-lift p-7 md:p-10">
          <h3 className="mb-6 text-sm font-medium text-primary">{t.brindo.title}</h3>
          <ul className="grid gap-4">
            {t.brindo.items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={2.25} aria-hidden="true" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
