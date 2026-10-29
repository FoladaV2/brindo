import { CalendarPlus, MessageCircle, PenLine, RefreshCcw, Smartphone, Users } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Reveal } from "@/templates/ui/Reveal";
import { Section, SectionHeading } from "./section";

const t = copy.home.features;
const ICONS = [Smartphone, Users, RefreshCcw, CalendarPlus, MessageCircle, PenLine];

export function Features() {
  return (
    <Section id="features" labelledBy="features-title">
      <SectionHeading id="features-title" eyebrow={t.eyebrow} title={t.heading} />
      {/* 1px gaps over a line-coloured background draw the hairlines between cells. */}
      <Reveal>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:mt-20 md:grid-cols-2 lg:grid-cols-3">
          {t.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <li key={item.title} className="grid content-start gap-4 bg-lift p-7 md:p-9">
                <Icon className="size-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="font-display text-heading">{item.title}</h3>
                <p className="text-muted-foreground">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </Section>
  );
}
