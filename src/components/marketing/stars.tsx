import { useId } from "react";
import { cn } from "@/lib/utils";

const STAR = "M8 1.2l2.05 4.3 4.7.6-3.45 3.25.88 4.65L8 11.7 3.82 14l.88-4.65L1.25 6.1l4.7-.6z";

/** Five stars, filled to the nearest half. Decorative: the rating is always written next to it. */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  const id = `star${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span aria-hidden="true" className={cn("inline-flex gap-0.5", className)}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fillPart = Math.max(0, Math.min(1, rounded - i));
        return (
          <svg key={i} viewBox="0 0 16 16" className="size-4">
            <defs>
              <clipPath id={`${id}-${i}`}>
                <rect width={16 * fillPart} height="16" />
              </clipPath>
            </defs>
            <path d={STAR} fill="none" stroke="var(--wine)" strokeWidth="1" strokeLinejoin="round" />
            <path d={STAR} fill="var(--wine)" clipPath={`url(#${id}-${i})`} />
          </svg>
        );
      })}
    </span>
  );
}
