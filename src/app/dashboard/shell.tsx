import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { BottomNav, BottomNavView, SidebarNav, SidebarNavView } from "./nav";

const t = copy.dashboard;

/**
 * The host's area. Desktop: a sidebar (logo, create, sections, account). Phones: a top bar and a
 * bottom bar with a raised create button. `focus` (the editor) hides both phone bars: the editor
 * has its own header and Preview button.
 */
export function DashboardShell({ children, focus = false }: { children: ReactNode; focus?: boolean }) {
  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-border bg-background px-5 py-6 lg:flex">
        <div className="grid gap-8">
          <Link href="/dashboard" aria-label={t.title} className="w-fit rounded-full px-2 py-1">
            <Logo height={19} />
          </Link>
          {/* The active section needs the URL, which streams in; until then nothing is highlighted. */}
          <Suspense fallback={<SidebarNavView path="" />}>
            <SidebarNav />
          </Suspense>
        </div>
        <div className="grid gap-3 border-t border-border pt-5">
          <Suspense fallback={<span className="h-5" />}>
            <AccountEmail />
          </Suspense>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <LogOut strokeWidth={1.75} /> {t.signOut}
            </Button>
          </form>
        </div>
      </aside>

      {focus ? null : (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-gutter-brand backdrop-blur-nav lg:hidden">
        <Link href="/dashboard" aria-label={t.title} className="-ml-1 rounded-full p-1">
          <Logo height={17} />
          </Link>
        </header>
      )}

      <div className={focus ? "" : "pb-24 lg:pb-0"}>{children}</div>
      {focus ? null : (
        <Suspense fallback={<BottomNavView path="" />}>
          <BottomNav />
        </Suspense>
      )}
    </div>
  );
}

/** Who is signed in. Read per request, so it streams in after the shell. */
async function AccountEmail() {
  const { data } = await (await createClient()).auth.getClaims();
  const email = typeof data?.claims.email === "string" ? data.claims.email : null;
  if (!email) return null;
  return (
    <p className="grid gap-0.5 text-sm">
      <span className="text-muted-foreground">{t.signedInAs}</span>
      <span className="truncate font-medium">{email}</span>
    </p>
  );
}
