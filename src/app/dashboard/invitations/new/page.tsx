import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { copy } from "@content/copy.ka";
import { isEventType } from "@/lib/events";
import { DashboardShell } from "../../shell";
import { CreateForm } from "./create-form";

const t = copy.create;

export const metadata: Metadata = {
  title: t.title,
  robots: { index: false, follow: false },
};

/** Step one of a new invitation. ?type=birthday (from onboarding) preselects the event type. */
export default function NewInvitationPage({ searchParams }: PageProps<"/dashboard/invitations/new">) {
  return (
    <DashboardShell>
      <section className="mx-auto grid max-w-2xl gap-8 px-gutter-brand pt-6 pb-24 sm:pt-12">
        <Link href="/dashboard" className="-ml-2 inline-flex h-10 items-center gap-2 justify-self-start rounded-full px-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
          {t.back}
        </Link>
        <div className="grid gap-3">
          <h1 className="font-display text-title">{t.heading}</h1>
          <p className="text-lead text-muted-foreground">{t.lead}</p>
        </div>
        <Suspense fallback={<CreateForm initialType={null} />}>
          <WithType type={searchParams.then((q) => q.type)} />
        </Suspense>
      </section>
    </DashboardShell>
  );
}

async function WithType({ type }: { type: Promise<string | string[] | undefined> }) {
  const value = await type;
  return <CreateForm initialType={isEventType(value) ? value : null} />;
}
