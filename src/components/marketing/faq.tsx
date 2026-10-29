import { copy } from "@content/copy.ka";
import { fill } from "@/lib/text";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Section, SectionHeading } from "./section";

const t = copy.home.faq;

export function Faq({ price }: { price: string }) {
  return (
    <Section id="faq" labelledBy="faq-title">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <SectionHeading id="faq-title" eyebrow={t.eyebrow} title={t.heading} align="start" className="lg:sticky lg:top-32 lg:self-start" />
        <Accordion type="single" collapsible defaultValue="0" className="border-t">
          {t.items.map((item, i) => (
            <AccordionItem key={item.q} value={String(i)}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{fill(item.a, { price })}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
