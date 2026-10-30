import Link from "next/link";
import { copy } from "@content/copy.ka";
import { LogoMark } from "@/components/brand/logo";
import { Button, ButtonArrow } from "@/components/ui/button";
import { Reveal } from "@/templates/ui/Reveal";
import { GridBackdrop } from "./grid-backdrop";
import { Section } from "./section";

const t = copy.home.final;

export function FinalCta() {
  return (
    <Section labelledBy="final-title" className="pt-0">
      <Reveal className="relative isolate overflow-hidden rounded-2xl border border-border bg-lift px-6 py-20 text-center md:px-16 md:py-28">
        <GridBackdrop />
        <div aria-hidden="true" className="absolute top-full left-1/2 -z-10 size-[48rem] -translate-x-1/2 -translate-y-1/2 bg-(image:--glow-wine)" />
        <div className="mx-auto grid max-w-2xl justify-items-center gap-7">
          <LogoMark size={44} />
          <h2 id="final-title" className="font-display text-title">
            {t.heading}
          </h2>
          <p className="text-lead text-muted-foreground">{t.body}</p>
          <Button asChild size="lg">
            <Link href="/register">
              {t.cta} <ButtonArrow />
            </Link>
          </Button>
        </div>
      </Reveal>
    </Section>
  );
}
