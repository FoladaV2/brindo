import type { ElementType } from "react";
import { clsx } from "clsx";
import { isLatinOnly } from "@/lib/text";

type LabelProps = {
  children: string;
  id?: string;
  as?: ElementType;
  className?: string;
};

/**
 * Small, widely tracked label. Latin-only strings are set in capitals; Georgian is never
 * uppercased, because text-transform can map it to Mtavruli, which the display font lacks.
 */
export function Label({ children, id, as: Tag = "span", className }: LabelProps) {
  return <Tag id={id} className={clsx("label", isLatinOnly(children) && "label-latin", className)}>{children}</Tag>;
}
