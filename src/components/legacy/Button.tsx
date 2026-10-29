import type { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";
import { copy } from "@content/copy.ka";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
};

/**
 * Pill button, 48px minimum height. Primary: ink pill with a champagne hairline (champagne pill on dark).
 * Secondary: hairline outline. Presses scale to 0.98; pointer devices get one light sweep on hover.
 */
export function Button({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx("btn", variant === "primary" ? "btn-primary" : "btn-secondary", className)}
      {...props}
    >
      <span className="btn-label">{children}</span>
      {loading && (
        <>
          <span className="btn-spinner" aria-hidden />
          <span className="sr-only">{copy.ui.loading}</span>
        </>
      )}
    </button>
  );
}
