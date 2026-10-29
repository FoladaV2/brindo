import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/button";
import type { OwnInvitation } from "@/lib/invitations/access";
import type { Json } from "@/lib/supabase/database.types";
import { Empty, EventCard } from "../../dashboard/event-card";
import { DashboardShell } from "../../dashboard/shell";
import { previewEnabled } from "../samples";

export const metadata: Metadata = {
  title: "Dashboard preview",
  robots: { index: false, follow: false, nocache: true },
};

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Json;
const at = "2027-05-20T10:00:00.000Z";

const EVENTS: { invitation: OwnInvitation; count?: { people: number; replies: number } }[] = [
  {
    invitation: { id: "sample-1", slug: "anas-30-k7xq", templateId: "noir", eventType: "birthday", maxPartySize: 6, content: json(copy.samples.birthday), status: "published", updatedAt: at },
    count: { people: 21, replies: 10 },
  },
  {
    invitation: { id: "sample-2", slug: "aleksandre-da-elisabed-m3pd", templateId: "lumiere", eventType: "wedding", maxPartySize: 6, content: json(copy.samples.full), status: "published", updatedAt: at },
    count: { people: 186, replies: 64 },
  },
  {
    invitation: { id: "sample-3", slug: "ia-da-luka-q2rt", templateId: "lumiere", eventType: "engagement", maxPartySize: 4, content: json({ partners: ["ია", "ლუკა"] }), status: "draft", updatedAt: at },
  },
];

/** The events list with sample events (?empty shows the first-time state), without a database. */
export default function DashboardPreviewPage({ searchParams }: PageProps<"/preview/dashboard">) {
  if (!previewEnabled) notFound();
  return (
    <DashboardShell>
      <section className="mx-auto grid max-w-5xl gap-8 px-gutter-brand pt-8 pb-16 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="font-display text-title">{copy.dashboard.heading}</h1>
            <p className="text-muted-foreground">{copy.dashboard.lead}</p>
          </div>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/dashboard/invitations/new">
              <Plus strokeWidth={2} /> {copy.dashboard.create}
            </Link>
          </Button>
        </div>
        <Suspense>
          <Events query={searchParams} />
        </Suspense>
      </section>
    </DashboardShell>
  );
}

async function Events({ query }: { query: Promise<Record<string, string | string[] | undefined>> }) {
  if ("empty" in (await query)) return <Empty />;
  return (
    <ul className="grid gap-4 md:grid-cols-2 md:gap-5">
      {EVENTS.map(({ invitation, count }) => (
        <li key={invitation.id}>
          <EventCard invitation={invitation} count={count} url={`https://brindo.ge/i/${invitation.slug}`} />
        </li>
      ))}
    </ul>
  );
}
