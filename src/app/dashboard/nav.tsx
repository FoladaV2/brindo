"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LifeBuoy, Plus, UserRound, type LucideIcon } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const t = copy.dashboard.nav;

type Item = { href: string; label: string; icon: LucideIcon; match: (path: string) => boolean };

const ITEMS: Item[] = [
  { href: "/dashboard", label: t.events, icon: CalendarDays, match: (p) => p === "/dashboard" || p.startsWith("/dashboard/invitations") },
  { href: "/dashboard/account", label: t.account, icon: UserRound, match: (p) => p.startsWith("/dashboard/account") },
];

/** Desktop sidebar: create, then the sections, then help. */
export function SidebarNav() {
  return <SidebarNavView path={usePathname()} />;
}

/** The sidebar for a given path; with no path (while the URL is not known yet) nothing is active. */
export function SidebarNavView({ path }: { path: string }) {
  return (
    <nav aria-label={t.label} className="grid gap-6">
      <Button asChild className="w-full">
        <Link href="/dashboard/invitations/new">
          <Plus strokeWidth={2} /> {t.create}
        </Link>
      </Button>
      <ul className="grid gap-1">
        {ITEMS.map((item) => (
          <li key={item.href}>
            <SidebarLink item={item} active={item.match(path)} />
          </li>
        ))}
        <li>
          <SidebarLink item={{ href: "/#faq", label: t.help, icon: LifeBuoy, match: () => false }} active={false} />
        </li>
      </ul>
    </nav>
  );
}

function SidebarLink({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-full px-4 text-[0.9375rem] text-muted-foreground hover:bg-accent hover:text-foreground",
        active && "bg-sunken font-medium text-foreground",
      )}
    >
      <Icon className={cn("size-[18px]", active && "text-primary")} strokeWidth={1.75} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

/** Phones: a bottom bar with the sections and a raised create button in the middle. */
export function BottomNav() {
  return <BottomNavView path={usePathname()} />;
}

export function BottomNavView({ path }: { path: string }) {
  const [events, account] = ITEMS;
  return (
    <nav
      aria-label={t.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-nav lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-3 items-center">
        <li>
          <BottomLink item={events} active={events.match(path) && !path.endsWith("/new")} />
        </li>
        <li className="flex justify-center">
          <Link
            href="/dashboard/invitations/new"
            aria-label={t.create}
            aria-current={path.endsWith("/new") ? "page" : undefined}
            className="-mt-7 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-float inset-shadow-highlight outline-none transition-transform duration-150 ease-out active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Plus className="size-6" strokeWidth={2} aria-hidden="true" />
          </Link>
        </li>
        <li>
          <BottomLink item={account} active={account.match(path)} />
        </li>
      </ul>
    </nav>
  );
}

function BottomLink({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn("mx-auto flex h-14 w-24 flex-col items-center justify-center gap-1 rounded-lg text-xs text-muted-foreground", active && "text-primary")}
    >
      <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
      {item.label}
    </Link>
  );
}
