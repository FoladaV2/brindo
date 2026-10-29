import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listOwnInvitations } from "@/lib/invitations/access";
import { comingCounts } from "@/lib/responses/access";
import { createClient } from "@/lib/supabase/server";
import { Empty, EventCard } from "./event-card";
import { DashboardShell } from "./shell";

const t = copy.dashboard;

export const metadata: Metadata = {
  title: t.title,
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <DashboardShell>
      <section className="mx-auto grid max-w-5xl gap-8 px-gutter-brand pt-8 pb-16 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="font-display text-title">{t.heading}</h1>
            <p className="text-muted-foreground">{t.lead}</p>
          </div>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/dashboard/invitations/new">
              <Plus strokeWidth={2} /> {t.create}
            </Link>
          </Button>
        </div>
        <Suspense fallback={<ListSkeleton />}>
          <Invitations />
        </Suspense>
      </section>
    </DashboardShell>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-60 rounded-xl" />
      ))}
    </div>
  );
}

async function Invitations() {
  // getUser asks the auth server, so a revoked session is caught even if the proxy let it through.
  const { data } = await (await createClient()).auth.getUser();
  if (!data.user) redirect("/login");
  const invitations = await listOwnInvitations();
  if (invitations.length === 0) return <Empty />;
  const counts = await comingCounts(invitations.filter((i) => i.status === "published").map((i) => i.id));
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return (
    <ul className="grid gap-4 md:grid-cols-2 md:gap-5">
      {invitations.map((invitation) => (
        <li key={invitation.id}>
          <EventCard invitation={invitation} count={counts.get(invitation.id)} url={`${site}/i/${invitation.slug}`} />
        </li>
      ))}
    </ul>
  );
}
