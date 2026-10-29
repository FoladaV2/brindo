import type { CSSProperties, ReactNode } from "react";
import { Label } from "@/templates/ui/Label";

/** Label, heading and body, centered: the shape every state of the payment page shares. */
export function Message({
  label,
  heading,
  body,
  children,
}: {
  label: string;
  heading: ReactNode;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <Rule i={0}>
        <Label>{label}</Label>
      </Rule>
      <h1 className="rise-in mt-6 max-w-[18ch] font-display text-h2" style={stagger(1)}>
        {heading}
      </h1>
      <p className="rise-in mt-6 max-w-[38ch] text-fg-muted" style={stagger(2)}>
        {body}
      </p>
      {children}
    </div>
  );
}

/** A small label between two champagne hairlines. */
function Rule({ i, children }: { i: number; children: ReactNode }) {
  return (
    <div className="rise-in flex items-center gap-4" style={stagger(i)}>
      <span aria-hidden className="h-px w-10 bg-gilt" />
      {children}
      <span aria-hidden className="h-px w-10 bg-gilt" />
    </div>
  );
}

/** Position in the entrance sequence (see .rise-in). */
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;
