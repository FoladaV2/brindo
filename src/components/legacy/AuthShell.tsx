import type { ReactNode } from "react";
import Link from "next/link";
import { Grain } from "@/templates/ui/Grain";
import { Halo } from "@/templates/ui/Halo";
import { Label } from "@/templates/ui/Label";
import { Wordmark } from "@/components/brand/Wordmark";

/** Full-height light surface with the halo, grain and wordmark, for sign-in screens. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main data-surface="light" className="relative isolate min-h-dvh overflow-hidden">
      <Grain />
      <Halo />
      <div className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col px-6">
        <header className="flex h-24 shrink-0 items-center justify-center">
          <Wordmark height={26} tone="light" />
        </header>
        <div className="flex flex-1 flex-col justify-center pb-24 pt-8">{children}</div>
      </div>
    </main>
  );
}

/** Label between hairlines, the display heading and a short lead. */
export function AuthIntro({ label, heading, lead }: { label: string; heading: string; lead: string }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <span aria-hidden className="h-px w-10 bg-gilt" />
        <Label>{label}</Label>
        <span aria-hidden className="h-px w-10 bg-gilt" />
      </div>
      <h1 className="mt-6 max-w-[16ch] font-display text-h2">{heading}</h1>
      <p className="mt-6 max-w-[34ch] text-body text-fg-muted">{lead}</p>
    </>
  );
}

/** "No account yet? Register" under the form, and the other way round. */
export function AuthSwitch({ question, href, action }: { question: string; href: string; action: string }) {
  return (
    <p className="mt-10 flex flex-wrap items-center justify-center gap-x-2 text-small text-fg-muted">
      {question}
      <Link
        href={href}
        className="inline-flex min-h-tap items-center text-ui text-fg underline decoration-gilt decoration-1 underline-offset-[0.4em] hover:text-gilt-fg"
      >
        {action}
      </Link>
    </p>
  );
}
