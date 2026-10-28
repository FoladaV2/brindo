import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { copy } from "@content/copy.ka";
import { currentUserId, getOwnInvitation } from "@/lib/invitations/access";
import { latestOrderStatus } from "@/lib/payments/store";
import { DashboardShell } from "../../../shell";
import { ConfirmingPayment } from "./confirming";
import { Message, stagger } from "./message";
import { Published } from "./published";

const t = copy.payment.done;

export async function generateMetadata({ params }: PageProps<"/dashboard/invitations/[id]/done">): Promise<Metadata> {
  if (!(await getOwnInvitation((await params).id))) notFound();
  return { title: t.title, robots: { index: false, follow: false } };
}

/**
 * Where the checkout sends the couple back. The redirect proves nothing: this page reads the
 * invitation and its latest order from the database, and waits for the webhook if it hasn't come.
 */
export default function PaymentDonePage({ params }: PageProps<"/dashboard/invitations/[id]/done">) {
  return (
    <DashboardShell>
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-[36rem] flex-col justify-center px-gutter pt-8 pb-section">
        <Suspense fallback={null}>
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
    return <Published url={`${site}/i/${invitation.slug}`} slug={invitation.slug} guestsHref={`${editor}?tab=guests`} />;
  }

  // Ownership is settled above (RLS); orders themselves are readable only with the service role.
  const order = await latestOrderStatus(invitation.id);
  if (order === null) redirect(editor);
  if (order === "failed" || order === "refunded") {
    return (
      <Message label={t.failed.label} heading={t.failed.heading} body={t.failed.body}>
        <div className="rise-in mt-10" style={stagger(3)}>
          <Link href={editor} className="btn btn-primary">
            <span className="btn-label">{t.backToEditor}</span>
          </Link>
        </div>
      </Message>
    );
  }
  return <ConfirmingPayment editorHref={editor} />;
}
