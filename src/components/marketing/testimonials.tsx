import { copy } from "@content/copy.ka";
import { Badge } from "@/components/ui/badge";
import type { ShownReviews } from "@/lib/reviews";
import { Reveal } from "@/templates/ui/Reveal";
import { Section, SectionHeading } from "./section";
import { Stars } from "./stars";

const t = copy.home.testimonials;

/** Renders only real reviews in production (src/lib/reviews.ts); samples are labelled. */
export function Testimonials({ reviews }: { reviews: ShownReviews | null }) {
  if (!reviews) return null;
  return (
    <Section labelledBy="testimonials-title">
      <SectionHeading id="testimonials-title" eyebrow={t.eyebrow} title={t.heading} />
      {reviews.sample ? (
        <div className="mt-6 flex justify-center">
          <Badge variant="outline">{copy.home.hero.sample}</Badge>
        </div>
      ) : null}
      <ul className="mt-14 grid gap-4 md:mt-20 md:grid-cols-2 md:gap-6">
        {reviews.reviews.map((review, i) => (
          <Reveal as="li" key={`${review.name}-${i}`} delay={(i % 2) * 90} className="flex flex-col gap-6 rounded-xl border border-border bg-lift p-7 md:p-9">
            <Stars rating={review.rating} />
            <blockquote className="flex-1 text-lead leading-relaxed">
              <p>„{review.quote}“</p>
            </blockquote>
            <div className="grid gap-0.5 border-t border-border pt-5 text-sm">
              <span className="font-medium">{review.name}</span>
              <span className="text-muted-foreground">{review.event}</span>
            </div>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
