import { clsx } from "clsx";

type HaloProps = {
  /** "surface" follows the surface (champagne on light, moonlight on dark). */
  tone?: "surface" | "champagne" | "rose";
  /** Slow ambient drift. Use on at most one element per page. */
  drift?: boolean;
  className?: string;
};

/** Soft radial glow from the top, fading in over 1.6s. Pure CSS gradient; place inside a relative, clipped parent. */
export function Halo({ tone = "surface", drift = false, className }: HaloProps) {
  return (
    <div
      aria-hidden
      className={clsx("halo", className)}
      data-tone={tone === "surface" ? undefined : tone}
      data-drift={drift ? "" : undefined}
    />
  );
}
