import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/button";
import { currentUserId, getOwnInvitation } from "@/lib/invitations/access";
import { draftTitle, invitationDraftSchema } from "@/lib/invitations/schema";
import { latestOrderStatus } from "@/lib/payments/store";
import { DashboardShell } from "../../../shell";
import { ConfirmingPayment } from "./confirming";
import { Message } from "./message";
import { Published } from "./published";

const t = copy.payment.done;

export async function generateMetadata({ params }: PageProps<"/dashboard/invitations/[id]/done">): Promise<Metadata> {
  if (!(await getOwnInvitation((await params).id))) notFound();
  return { title: t.title, robots: { index: false, follow: false } };
}

/**
 * Where the checkout sends the host back. The redirect proves nothing: this page reads the
 * invitation and its latest order from the database, and waits for the webhook if it hasn't come.
 */
export default function PaymentDonePage({ params }: PageProps<"/dashboard/invitations/[id]/done">) {
  return (
    <DashboardShell>
      <section className="mx-auto grid min-h-[calc(100dvh-8rem)] max-w-xl content-center px-gutter-brand py-12">
        <Suspense fallback={<Loader2 className="mx-auto size-6 animate-spin text-primary motion-reduce:animate-none" aria-hidden />}>
          <PaymentState id={params.then((p) => p.id)} />
        </Suspense>
      </section>
    </DashboardShell>
  );
}

async function PaymentState({ id }: { id: Promise<string> }) {
  if (!(await currentUserId())) redirect("/login");
  const invitation = await getOwnInvitation(await id);
  if (!invitation) notFound();
  const editor = `/dashboard/invitations/${invitation.id}/edit`;

  if (invitation.status !== "draft") {
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const draft = invitationDraftSchema.safeParse(invitation.content);
    const title = (draft.success && draftTitle(draft.data, copy.invitation.ampersand)) || copy.events.types[invitation.eventType];
    return (
      <Published
        url={`${site}/i/${invitation.slug}`}
        slug={invitation.slug}
        title={title}
        responsesHref={`/dashboard/invitations/${invitation.id}/responses`}
      />
    );
  }

  // Ownership is settled above (RLS); orders themselves are readable only with the service role.
  const order = await latestOrderStatus(invitation.id);
  if (order === null) redirect(editor);
  if (order === "failed" || order === "refunded") {
    return (
      <Message label={t.failed.label} heading={t.failed.heading} body={t.failed.body}>
        <Button asChild className="mt-4">
          <Link href={editor}>{t.backToEditor}</Link>
        </Button>
      </Message>
    );
  }
  return <ConfirmingPayment editorHref={editor} />;
}
