import type { ReactNode } from "react";
import { Grain } from "@/components/ui/Grain";
import { Halo } from "@/components/ui/Halo";
import { Wordmark } from "@/components/ui/Wordmark";

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
