import type { CSSProperties } from "react";
import { clsx } from "clsx";
import { MONOGRAM, WORDMARK } from "./wordmark-paths";

type WordmarkProps = {
  /** Rendered height in px. Width follows the outline's proportions. */
  height?: number;
  /** "light" = ink letters for light backgrounds, "dark" = ivory letters, "auto" = follows the surface. */
  tone?: "light" | "dark" | "auto";
  monogram?: boolean;
  className?: string;
};

const LETTER_COLOR = { light: "var(--ink)", dark: "var(--ivory)", auto: "currentColor" } as const;
const RISE_PX = 3;

/** Lowercase "brindo" from the display font's outlines; the dot of the i is a rising champagne bubble. */
export function Wordmark({ height = 28, tone = "auto", monogram = false, className }: WordmarkProps) {
  const art = monogram ? MONOGRAM : WORDMARK;
  const unitsPerPx = art.height / height;
  const style = { "--bubble-rise": `${-RISE_PX * unitsPerPx}px` } as CSSProperties;

  return (
    <svg
      viewBox={`0 0 ${art.width} ${art.height}`}
      height={height}
      width={Math.round((art.width / art.height) * height)}
      role="img"
      aria-label="Brindo"
      className={clsx("wordmark", className)}
      style={style}
    >
      <path d={art.path} fill={LETTER_COLOR[tone]} />
      <circle
        className="wordmark-bubble"
        cx={art.bubble.cx}
        cy={art.bubble.cy}
        r={art.bubble.r}
        fill="var(--champagne)"
      />
    </svg>
  );
}
