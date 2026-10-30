import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy } from "@content/copy.ka";
import { resolveInvitationPage } from "@/lib/invitations/access";
import { ThanksScreen } from "@/templates/shared/ThanksScreen";

type Props = PageProps<"/i/[slug]/thanks">;

/** Same rule as the invitation: an unpublished slug is a real 404 to everyone but its owner. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!(await resolveInvitationPage(slug))) notFound();
  return { title: { absolute: copy.invitation.thanks.title }, robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };
}

export default function ThanksPage({ params }: Props) {
  return (
    <Suspense fallback={<div data-surface="light" className="min-h-svh bg-bg" />}>
      <Thanks slug={params.then((p) => p.slug)} />
    </Suspense>
  );
}

async function Thanks({ slug: slugPromise }: { slug: Promise<string> }) {
  const slug = await slugPromise;
  const page = await resolveInvitationPage(slug);
  if (!page) notFound();
  return <ThanksScreen templateId={page.templateId} rsvp={{ slug, submit: page.isDraftPreview ? "demo" : "live" }} invitationHref={`/i/${slug}`} />;
}
