import type { CSSProperties, ReactNode } from "react";
import { clsx } from "clsx";

type LightSweepProps = {
  children: ReactNode;
  /** Delay before the sweep starts, in ms. */
  delay?: number;
  className?: string;
};

/**
 * One soft band of light crosses the text once, left to right, over 1.8s. The text stays flat;
 * a lighter copy shows only through the moving band. Hidden entirely under reduced motion.
 */
export function LightSweep({ children, delay = 400, className }: LightSweepProps) {
  return (
    <span className={clsx("sweep", className)} style={{ "--sweep-delay": `${delay}ms` } as CSSProperties}>
      {children}
      <span className="sweep-clip" aria-hidden>
        <span className="sweep-band">
          <span className="sweep-glint">{children}</span>
        </span>
      </span>
    </span>
  );
}
