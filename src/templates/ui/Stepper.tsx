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
  /** Centered, aligned to the start edge (editor forms), or a row: label and hint left, buttons right. */
  align?: "center" | "start" | "row";
  /** A line under the label (row only), announced with the group. */
  hint?: string;
  className?: string;
};

/** Party-size stepper with 48px targets. Works controlled (value) or uncontrolled (defaultValue). */
export function Stepper({ label, buttonLabels, min = 1, max = 10, value, defaultValue, onChange, name, align = "center", hint, className }: StepperProps) {
  const labelId = useId();
  const hintId = `${labelId}-hint`;
  const row = align === "row";
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
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={row && hint ? hintId : undefined}
      className={clsx(
        "flex",
        row ? "flex-wrap items-center justify-between gap-x-6 gap-y-3" : "flex-col gap-4",
        align === "center" && "items-center",
        align === "start" && "items-start",
        className,
      )}
    >
      {row ? (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span id={labelId} className="text-ui font-medium">
            {label}
          </span>
          {hint && (
            <span id={hintId} className="text-small text-fg-muted">
              {hint}
            </span>
          )}
        </div>
      ) : (
        <Label id={labelId}>{label}</Label>
      )}
      <div className={clsx("flex items-center", row ? "gap-3" : "gap-6")}>
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
          className={clsx(
            "grid place-items-center overflow-clip font-display leading-none tabular-nums",
            row ? "h-12 w-10 text-h3" : "h-14 w-14 text-h2",
          )}
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
