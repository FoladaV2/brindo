import Link from "next/link";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Logo, LogoMark } from "@/components/brand/logo";

const t = copy.auth.aside;

/**
 * Sign-in and registration: the form on bone, and on wide screens an onyx panel that shows what
 * the account is for (a host's live answers). Phones get the form alone.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,0.9fr)]">
      <div className="flex flex-col px-gutter-brand">
        <header className="flex h-20 items-center">
          <Link href="/" aria-label={copy.home.nav.home} className="-m-2 rounded-full p-2">
            <Logo height={19} />
          </Link>
        </header>
        <main className="flex flex-1 items-start justify-center pt-6 pb-16 sm:items-center sm:pt-0">
          <div className="w-full max-w-[25rem]">{children}</div>
        </main>
      </div>

      <aside aria-hidden="true" className="inverted relative isolate hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-20">
        <div className="absolute -right-40 -bottom-40 -z-10 size-[44rem] bg-[radial-gradient(50%_50%_at_50%_50%,rgb(122_31_43/0.45),transparent_70%)]" />
        <LogoMark size={36} tone="bone" bubble="bone" />
        <div className="grid max-w-md gap-10">
          <p className="font-display text-title">{t.heading}</p>
          <div className="grid gap-3 rounded-xl border border-border bg-bone-line/40 p-6">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{t.card.label}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl leading-none tabular">186</span>
                <span className="text-xs text-muted-foreground">{t.card.unit}</span>
              </span>
            </div>
            <div className="h-px bg-border" />
            <ul className="grid gap-2.5">
              {t.card.rows.map(([name, count]) => (
                <li key={name} className="flex items-center gap-3 text-sm">
                  <span className="grid size-5 place-items-center rounded-full bg-bone text-onyx">
                    <Check className="size-3" strokeWidth={2.5} />
                  </span>
                  <span className="flex-1">{name}</span>
                  <span className="text-muted-foreground tabular">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t.footer}</p>
      </aside>
    </div>
  );
}

/** Heading block above an auth form. */
export function AuthHeading({ heading, lead }: { heading: string; lead: string }) {
  return (
    <div className="grid gap-3">
      <h1 className="font-display text-title">{heading}</h1>
      <p className="text-muted-foreground">{lead}</p>
    </div>
  );
}

/** "No account yet? Register" under the form. */
export function AuthSwitch({ question, href, action }: { question: string; href: string; action: string }) {
  return (
    <p className="mt-8 text-center text-[0.9375rem] text-muted-foreground">
      {question}{" "}
      <Link href={href} className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">
        {action}
      </Link>
    </p>
  );
}
