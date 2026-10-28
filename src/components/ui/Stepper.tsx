"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { clsx } from "clsx";
import { Label } from "./Label";

type StepperProps = {
  label: string;
  /** Accessible names of the − and + buttons (copy.ui.decrease / copy.ui.increase). Passed in so client
      bundles that use the stepper don't pull in the whole copy file. */
  buttonLabels: { decrease: string; increase: string };
  min?: number;
  max?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Form field name; the value is submitted through a hidden input. */
  name?: string;
  /** Centered (invitations) or aligned to the start edge (editor forms). */
  align?: "center" | "start";
  className?: string;
};

/** Party-size stepper with 48px targets. Works controlled (value) or uncontrolled (defaultValue). */
export function Stepper({ label, buttonLabels, min = 1, max = 10, value, defaultValue, onChange, name, align = "center", className }: StepperProps) {
  const labelId = useId();
  const [inner, setInner] = useState(defaultValue ?? min);
  const current = value ?? inner;
  // null until the first change, so the number doesn't animate on page load
  const [dir, setDir] = useState<"up" | "down" | null>(null);

  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    if (clamped === current) return;
    setDir(clamped > current ? "up" : "down");
    if (value === undefined) setInner(clamped);
    onChange?.(clamped);
  };

  return (
    <div role="group" aria-labelledby={labelId} className={clsx("flex flex-col gap-4", align === "center" ? "items-center" : "items-start", className)}>
      <Label id={labelId}>{label}</Label>
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="stepper-button"
          onClick={() => set(current - 1)}
          disabled={current <= min}
          aria-label={buttonLabels.decrease}
        >
          <Minus size={18} strokeWidth={1.25} aria-hidden />
        </button>
        <output
          aria-live="polite"
          className="grid h-14 w-14 place-items-center overflow-clip font-display text-h2 leading-none tabular-nums"
        >
          <span key={current} className={dir ? "stepper-value" : undefined} data-dir={dir ?? undefined}>
            {current}
          </span>
        </output>
        <button
          type="button"
          className="stepper-button"
          onClick={() => set(current + 1)}
          disabled={current >= max}
          aria-label={buttonLabels.increase}
        >
          <Plus size={18} strokeWidth={1.25} aria-hidden />
        </button>
      </div>
      {name && <input type="hidden" name={name} value={current} />}
    </div>
  );
}
