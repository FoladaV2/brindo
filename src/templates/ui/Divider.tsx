import { clsx } from "clsx";

type DividerProps = {
  ornament?: "ring" | "diamond";
  className?: string;
};

/** Hairline divider with a small centered ornament: the only decorative element in the system. */
export function Divider({ ornament = "ring", className }: DividerProps) {
  return (
    <div role="separator" className={clsx("divider", className)}>
      <span className={ornament === "ring" ? "divider-ring" : "divider-diamond"} aria-hidden />
    </div>
  );
}
