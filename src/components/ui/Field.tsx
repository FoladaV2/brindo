"use client";

import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

type FieldOwnProps = {
  label: string;
  /** Shown under the field and announced to screen readers. Marks the field invalid. */
  error?: string;
  hint?: string;
  className?: string;
};

type InputProps = FieldOwnProps & Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder" | "className">;
type TextareaProps = FieldOwnProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "placeholder" | "className">;

function useFieldIds(id: string | undefined) {
  const auto = useId();
  const controlId = id ?? auto;
  return { controlId, messageId: `${controlId}-message` };
}

function FieldFrame({
  label,
  error,
  hint,
  className,
  controlId,
  messageId,
  children,
}: FieldOwnProps & { controlId: string; messageId: string; children: React.ReactNode }) {
  return (
    <div className={clsx("field", className)} data-invalid={error ? "" : undefined}>
      {children}
      <label htmlFor={controlId} className="field-label">
        {label}
      </label>
      <span className="field-line" aria-hidden />
      <p id={messageId} className="field-message" aria-live="polite">
        {error ?? hint}
      </p>
    </div>
  );
}

/** Underline input with a floating label; the champagne underline draws from the left on focus. */
export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const { controlId, messageId } = useFieldIds(id);
  return (
    <FieldFrame {...{ label, error, hint, className, controlId, messageId }}>
      <input
        id={controlId}
        placeholder=" "
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className="field-control"
        {...props}
      />
    </FieldFrame>
  );
}

export function Textarea({ label, error, hint, className, id, rows = 4, ...props }: TextareaProps) {
  const { controlId, messageId } = useFieldIds(id);
  return (
    <FieldFrame {...{ label, error, hint, className, controlId, messageId }}>
      <textarea
        id={controlId}
        rows={rows}
        placeholder=" "
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className="field-control"
        {...props}
      />
    </FieldFrame>
  );
}
