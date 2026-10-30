import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** [column, row, delay in s] of the cells that glow, in a 24 by 14 grid. Fixed so server and client agree. */
const CELLS: readonly [number, number, number][] = [
  [3, 2, 0],
  [8, 1, 2.4],
  [14, 3, 1.1],
  [19, 2, 3.6],
  [22, 5, 0.6],
  [5, 5, 4.2],
  [11, 6, 2.9],
  [16, 7, 0.3],
  [1, 8, 1.8],
  [20, 9, 4.8],
  [7, 9, 3.3],
  [13, 10, 1.5],
  [2, 12, 5.1],
  [17, 12, 2.1],
  [10, 4, 5.6],
  [23, 11, 0.9],
];

/**
 * A quiet grid of hairlines behind a section, fading out from the middle, with a few cells that
 * slowly glow and fade (adapted from Aceternity UI's grid background and Magic UI's animated grid
 * pattern, in brand tints). Pure CSS: only opacity animates, and reduced motion leaves it still.
 * Place inside a relative, isolated parent.
 */
export function GridBackdrop({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("grid-backdrop", className)} data-tone={tone}>
      {CELLS.map(([x, y, delay]) => (
        <span key={`${x}-${y}`} className="grid-backdrop-cell" style={{ "--x": x, "--y": y, "--d": `${delay}s` } as CSSProperties} />
      ))}
    </div>
  );
}
