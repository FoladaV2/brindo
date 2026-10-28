import { clsx } from "clsx";
import { Label } from "./Label";

type ChipProps = {
  children: string;
  /** "filled": done or live. "hollow": in progress. "muted": closed, steps back. */
  dot?: "filled" | "hollow" | "muted";
  className?: string;
};

/** A quiet status pill: hairline outline, a small ring or dot, and a tracked label. */
export function Chip({ children, dot = "hollow", className }: ChipProps) {
  return (
    <span className={clsx("inline-flex items-center gap-3 rounded-pill border border-hairline px-4 py-1.5", className)}>
      <span
        aria-hidden
        className={clsx(
          "h-2 w-2 shrink-0 rounded-pill border",
          dot === "muted" ? "border-control" : "border-accent",
          dot === "filled" && "bg-accent",
        )}
      />
      <Label className={dot === "muted" ? "text-fg-muted" : undefined}>{children}</Label>
    </span>
  );
}
