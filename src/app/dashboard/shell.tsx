import type { ReactNode } from "react";
import Link from "next/link";
import { copy } from "@content/copy.ka";
import { Grain } from "@/components/ui/Grain";
import { Halo } from "@/components/ui/Halo";
import { Wordmark } from "@/components/ui/Wordmark";
import { signOut } from "./actions";

/** The couple's area: light surface, a quiet header with the wordmark and sign-out. */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <main data-surface="light" className="relative isolate min-h-dvh overflow-clip">
      <Grain />
      <Halo />
      <header className="relative mx-auto flex h-20 max-w-[1200px] items-center justify-between gap-6 px-gutter">
        <Link href="/dashboard" aria-label={copy.dashboard.title} className="flex min-h-tap items-center">
          <Wordmark height={22} tone="light" />
        </Link>
        <form action={signOut}>
          <button type="submit" className="min-h-tap px-2 text-small text-fg-muted hover:text-fg">
            {copy.dashboard.signOut}
          </button>
        </form>
      </header>
      <div className="relative">{children}</div>
    </main>
  );
}
