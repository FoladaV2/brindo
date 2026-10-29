import Image from "next/image";
import { copy } from "@content/copy.ka";
import { fill } from "@/lib/text";
import { Reveal } from "@/templates/ui/Reveal";
import { Section, SectionHeading } from "./section";

const t = copy.home.demo;
const IDS = ["lumiere", "noir"] as const;

/** The real templates, as guests see them on a phone (rendered by scripts/build-marketing-shots.mjs). */
export function TemplateDemo() {
  return (
    <Section labelledBy="demo-title" className="overflow-x-clip">
      <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
        <SectionHeading id="demo-title" eyebrow={t.eyebrow} title={t.heading} lead={t.body} align="start" className="lg:max-w-md" />
        <div className="relative isolate flex justify-center gap-4 sm:gap-8">
          <div aria-hidden="true" className="absolute top-1/2 left-1/2 -z-10 size-[40rem] -translate-x-1/2 -translate-y-1/2 bg-(image:--glow-wine)" />
          {IDS.map((id, i) => (
            <Reveal key={id} delay={i * 120} className={i === 1 ? "mt-16 sm:mt-24" : ""}>
              <figure className="grid gap-4">
                <div className="w-[9.5rem] rounded-[1.75rem] border-[6px] border-onyx bg-onyx shadow-float sm:w-[13rem] sm:rounded-[2.25rem] sm:border-8 md:w-[15rem]">
                  <Image
                    src={`/marketing/${id}.webp`}
                    alt={fill(t.alt, { name: t.templates[i].name })}
                    width={780}
                    height={1688}
                    sizes="(min-width: 768px) 240px, (min-width: 640px) 208px, 152px"
                    className="block h-auto w-full rounded-[1.3rem] sm:rounded-[1.75rem]"
                  />
                </div>
                <figcaption className="grid gap-0.5 px-1">
                  <span className="font-display text-lg">{t.templates[i].name}</span>
                  <span className="text-sm text-muted-foreground">{t.templates[i].note}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
