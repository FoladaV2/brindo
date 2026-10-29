import { clsx } from "clsx";

/** Static paper-grain overlay at 3–4% opacity. Sits behind content: place inside a relative, isolated parent. */
export function Grain({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("grain", className)} />;
}
