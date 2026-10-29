import { cn } from "@/lib/utils";
import { WORDMARK } from "./wordmark-paths";

/*
 * The mark: the clink. Two glass rims (circles of radius 9, centres 18 apart) that just touch at
 * (20, 21), and one wine bubble rising from the point of contact, the same bubble as the dot of
 * the "i" in the wordmark.
 */
const MARK = { width: 40, height: 32 };

type Tone = "onyx" | "bone";

type MarkProps = {
  size?: number;
  tone?: Tone;
  /** The bubble is wine, except on a wine tile (the app icon), where it is bone. */
  bubble?: "wine" | "bone";
  className?: string;
};

export function LogoMark({ size = 28, tone = "onyx", bubble = "wine", className }: MarkProps) {
  const ink = tone === "onyx" ? "var(--onyx)" : "var(--bone)";
  return (
    <svg
      viewBox={`0 0 ${MARK.width} ${MARK.height}`}
      height={size}
      width={Math.round((MARK.width / MARK.height) * size)}
      aria-hidden="true"
      className={cn("logo-mark shrink-0 overflow-visible", className)}
    >
      <circle className="logo-rim-l" cx="11" cy="21" r="9" fill="none" stroke={ink} strokeWidth="2.25" />
      <circle className="logo-rim-r" cx="29" cy="21" r="9" fill="none" stroke={ink} strokeWidth="2.25" />
      <circle className="logo-bubble" cx="20" cy="6" r="3" fill={`var(--${bubble})`} />
    </svg>
  );
}

export function LogoWordmark({ height = 22, tone = "onyx", className }: { height?: number; tone?: Tone; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
      height={height}
      width={Math.round((WORDMARK.width / WORDMARK.height) * height)}
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path d={WORDMARK.path} fill={tone === "onyx" ? "var(--onyx)" : "var(--bone)"} />
      <circle cx={WORDMARK.bubble.cx} cy={WORDMARK.bubble.cy} r={WORDMARK.bubble.r} fill={tone === "onyx" ? "var(--wine)" : "var(--bone)"} />
    </svg>
  );
}

/** Mark and wordmark side by side. `height` is the wordmark's height; the mark scales with it. */
export function Logo({ height = 22, tone = "onyx", className }: { height?: number; tone?: Tone; className?: string }) {
  return (
    <span role="img" aria-label="Brindo" className={cn("logo inline-flex items-center", className)} style={{ gap: height * 0.4 }}>
      <LogoMark size={Math.round(height * 1.25)} tone={tone} />
      <LogoWordmark height={height} tone={tone} />
    </span>
  );
}
