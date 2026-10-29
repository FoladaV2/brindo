import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button, ButtonArrow } from "@/components/ui/button";
import { Reveal } from "@/templates/ui/Reveal";
import { Section, SectionHeading } from "./section";

const t = copy.home.pricing;

/** One price, one inverted card. The amount shown is the server price (src/lib/payments/price.ts). */
export function Pricing({ price }: { price: string }) {
  return (
    <Section id="pricing" labelledBy="pricing-title">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <SectionHeading id="pricing-title" eyebrow={t.eyebrow} title={t.heading} lead={t.body} align="start" />
        <Reveal className="inverted relative isolate overflow-hidden rounded-2xl p-8 md:p-12">
          <div aria-hidden="true" className="absolute -top-1/2 -right-1/3 -z-10 size-[36rem] bg-[radial-gradient(50%_50%_at_50%_50%,rgb(246_241_234/0.08),transparent_70%)]" />
          <div className="grid gap-8">
            <div className="grid gap-2">
              <span className="text-sm text-muted-foreground">{t.per}</span>
              <span className="font-display text-[clamp(4rem,3rem+4vw,6.5rem)] leading-none tabular">{price}</span>
            </div>
            <ul className="grid gap-3.5">
              {t.includes.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <Check className="mt-1 size-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="grid gap-4">
              <Button asChild size="lg" className="w-full">
                <Link href="/register">
                  {t.cta} <ButtonArrow />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">{t.note}</p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                {t.secure}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
