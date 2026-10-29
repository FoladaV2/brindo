import Link from "next/link";
import { Check } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonArrow } from "@/components/ui/button";
import { fill } from "@/lib/text";
import type { ShownReviews } from "@/lib/reviews";
import { HeroVisual } from "./hero-visual";
import { Stars } from "./stars";

const t = copy.home.hero;

export function Hero({ reviews, price }: { reviews: ShownReviews | null; price: string }) {
  return (
    <section className="relative px-gutter-brand pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-40">
      <div className="mx-auto grid max-w-page items-center gap-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
        <div className="hero-copy grid justify-items-start gap-7">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1 className="font-display text-hero">{t.headline}</h1>
          <p className="max-w-[34rem] text-lead text-muted-foreground">{t.sub}</p>

          <div className="grid w-full gap-5 pt-1 sm:w-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/register">
                  {t.cta}
                  <ButtonArrow />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href="#how">{t.secondary}</a>
              </Button>
            </div>

            {reviews ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <Stars rating={Number(reviews.rating)} />
                <span className="font-medium tabular">{fill(t.rating, { rating: reviews.rating, count: String(reviews.reviews.length) })}</span>
                {reviews.sample ? <Badge variant="outline">{t.sample}</Badge> : null}
              </div>
            ) : null}
          </div>

          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
            {t.trust.map((line) => (
              <li key={line} className="flex items-center gap-2">
                <Check className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
                {fill(line, { price })}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
