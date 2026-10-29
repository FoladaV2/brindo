import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared look for text-like controls: 52px, 14px radius, raised fill, control border, wine focus. */
export const controlClass = cn(
  "w-full min-w-0 rounded-md border border-input bg-card text-base text-foreground",
  "placeholder:text-muted-foreground/80 hover:border-foreground/70",
  "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20",
  "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/15",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        controlClass,
        "h-13 px-4",
        "file:mr-3 file:inline-flex file:h-8 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
