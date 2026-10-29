import { REVIEWS, SAMPLE_REVIEWS, type Review } from "@content/reviews";
import { devToolsEnabled } from "@/lib/dev";

export type ShownReviews = {
  reviews: Review[];
  /** True when these are design samples (development and styleguide builds only). */
  sample: boolean;
  /** Average rating, one decimal, e.g. "4.8". */
  rating: string;
};

/** Real reviews when there are any; samples only where dev tools are enabled; otherwise nothing. */
export function shownReviews(real: Review[] = REVIEWS, devTools = devToolsEnabled): ShownReviews | null {
  const sample = real.length === 0;
  if (sample && !devTools) return null;
  const reviews = sample ? SAMPLE_REVIEWS : real;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { reviews, sample, rating: (Math.round(avg * 10) / 10).toFixed(1) };
}
