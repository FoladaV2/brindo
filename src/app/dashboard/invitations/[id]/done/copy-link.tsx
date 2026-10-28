"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { clsx } from "clsx";
import { copyText } from "@/lib/clipboard";

/** Copies the invitation link; the label confirms for two seconds. */
export function CopyLinkButton({ url, label, copiedLabel, className }: { url: string; label: string; copiedLabel: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className={clsx("btn btn-primary", className)}
      onClick={async () => {
        if (!(await copyText(url))) return;
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      }}
    >
      <span className="btn-label" aria-live="polite">
        {copied ? <Check size={18} strokeWidth={1.25} aria-hidden /> : <Copy size={18} strokeWidth={1.25} aria-hidden />}
        {copied ? copiedLabel : label}
      </span>
    </button>
  );
}
