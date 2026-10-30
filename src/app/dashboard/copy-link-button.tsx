"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { notify } from "@/lib/notify";

/** Copies the invitation link; the label confirms for two seconds, with a toast and a soft tick. */
export function CopyLinkButton({
  url,
  label,
  copiedLabel,
  toast,
  variant = "outline",
  size = "sm",
  className,
}: {
  url: string;
  label: string;
  copiedLabel: string;
  /** The toast's title and line underneath. */
  toast: { title: string; description: string };
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        if (!(await copyText(url))) return;
        setCopied(true);
        notify.done(toast.title, { description: toast.description, id: "link-copied" });
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check strokeWidth={2} aria-hidden /> : <Copy strokeWidth={1.75} aria-hidden />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </Button>
  );
}
