import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, LogOut } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { DashboardShell } from "../shell";

const t = copy.dashboard.account;

export const metadata: Metadata = {
  title: t.title,
  robots: { index: false, follow: false },
};

/** The signed-in host: their email, sign out, help and the legal pages. */
export default function AccountPage() {
  return (
    <DashboardShell>
      <section className="mx-auto grid max-w-2xl gap-8 px-gutter-brand pt-8 pb-16 sm:pt-12">
        <h1 className="font-display text-title">{t.heading}</h1>
        <div className="grid gap-5 rounded-xl border border-border bg-card p-6 sm:p-7">
          <Suspense fallback={<Skeleton className="h-12 w-64" />}>
            <Email />
          </Suspense>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              <LogOut strokeWidth={1.75} /> {copy.dashboard.signOut}
            </Button>
          </form>
        </div>
        <div className="grid gap-4 rounded-xl border border-border bg-card p-6 sm:p-7">
          <h2 className="font-display text-heading">{t.help}</h2>
          <p className="text-muted-foreground">{t.helpBody}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/#faq">
                {t.faq} <ArrowUpRight strokeWidth={1.75} />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/terms">{copy.home.footer.terms}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/privacy">{copy.home.footer.privacy}</Link>
            </Button>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

async function Email() {
  const { data } = await (await createClient()).auth.getUser();
  if (!data.user) redirect("/login");
  return (
    <p className="grid gap-1">
      <span className="text-sm text-muted-foreground">{t.email}</span>
      <span className="font-medium break-all">{data.user.email}</span>
    </p>
  );
}
