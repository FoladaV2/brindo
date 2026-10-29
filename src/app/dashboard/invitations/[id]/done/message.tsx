import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";

/** Eyebrow, heading and body, centered: the shape every state of the payment page shares. */
export function Message({ label, heading, body, children }: { label: string; heading: ReactNode; body: string; children?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-5 text-center animate-in fade-in-0 slide-in-from-bottom-2 transition-none duration-700 motion-reduce:animate-none">
      <LogoMark size={40} />
      <span className="eyebrow">{label}</span>
      <h1 className="max-w-[18ch] font-display text-title">{heading}</h1>
      <p className="max-w-md text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}
