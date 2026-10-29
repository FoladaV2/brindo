import { copy } from "@content/copy.ka";
import { Section, SectionHeading } from "./section";

const t = copy.home.events;

/**
 * Every kind of event, as a slow strip of large type. The strip is two identical halves moving by
 * -50% (transform only). Reduced motion: it stops and wraps into lines.
 */
export function EventTypes() {
  return (
    <Section labelledBy="events-title" className="px-0" innerClassName="max-w-none">
      <div className="px-gutter-brand">
        <SectionHeading id="events-title" eyebrow={t.eyebrow} title={t.heading} />
      </div>
      <p className="sr-only">{t.types.join(", ")}</p>
      <div aria-hidden="true" className="marquee mt-14 md:mt-20">
        <div className="marquee-track">
          {[0, 1].map((half) => (
            <ul key={half} className="marquee-half">
              {t.types.map((type) => (
                <li key={type} className="flex shrink-0 items-center gap-8 pr-8 md:gap-12 md:pr-12">
                  <span className="font-display text-title whitespace-nowrap">{type}</span>
                  <span className="size-2.5 shrink-0 rounded-full bg-wine" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </Section>
  );
}
