import type { ElementType } from "react";
import { clsx } from "clsx";
import { Label } from "./Label";

type SectionHeaderProps = {
  label: string;
  title: string;
  as?: ElementType;
  align?: "center" | "start";
  className?: string;
};

/** Small label, a champagne hairline, then the display title. */
export function SectionHeader({ label, title, as: Tag = "h2", align = "center", className }: SectionHeaderProps) {
  const centered = align === "center";
  return (
    <header className={clsx("flex flex-col gap-6", centered ? "items-center text-center" : "items-start", className)}>
      <div className="flex items-center gap-4">
        {centered && <span aria-hidden className="h-px w-10 bg-accent" />}
        <Label>{label}</Label>
        <span aria-hidden className="h-px w-10 bg-accent" />
      </div>
      <Tag className="max-w-[18ch] font-display text-h2">{title}</Tag>
    </header>
  );
}
