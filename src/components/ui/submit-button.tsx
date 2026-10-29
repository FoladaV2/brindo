"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { copy } from "@content/copy.ka";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type SubmitButtonProps = Omit<React.ComponentProps<typeof Button>, "type" | "asChild"> & { pending: boolean };

/** A form's submit button: while the action runs it shows a spinner and the "sending" label. */
function SubmitButton({ pending, children, disabled, className, ...props }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      // A running submit stays readable; only a truly unavailable button fades.
      className={cn(pending && "disabled:opacity-85", className)}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="size-[1.15em] animate-spin motion-reduce:animate-none" strokeWidth={2} aria-hidden="true" />
          {copy.ui.loading}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export { SubmitButton };
