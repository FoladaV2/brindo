"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { play } from "@/lib/sound";

/** A form-level error (not tied to one field): announced, with an icon, never colour alone, and a soft sound. */
export function FormError({ message }: { message: string | null | undefined }) {
  useEffect(() => {
    if (message) play("error");
  }, [message]);

  return (
    <p role="alert" className="flex items-start gap-2 rounded-md bg-selected px-4 py-3 text-sm text-primary empty:hidden">
      {message ? (
        <>
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{message}</span>
        </>
      ) : null}
    </p>
  );
}
