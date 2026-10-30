import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { copy } from "@content/copy.ka";
import { resolveInvitationPage } from "@/lib/invitations/access";
import { rsvpOpen } from "@/lib/invitations/datetime";
import { OG_SIZE } from "@/lib/invitations/og-size";
import { formatDate } from "@/templates/shared/format";
import { InvitationRenderer } from "@/templates/InvitationRenderer";
import { displayTitle } from "@/lib/invitations/schema";
import type { InvitationRsvp } from "@/templates/types";
import { imageVersion, pageContent } from "./content";

type Props = PageProps<"/i/[slug]">;

/**
 * Runs before the response starts (htmlLimitedBots in next.config.ts makes metadata blocking), so
 * an unpublished slug answers with a real 404 to everyone but its owner, and link-preview bots get
 * the tags in <head>.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await resolveInvitationPage(slug);
  const content = page && pageContent(page.content, page.isDraftPreview, page.updatedAt, page.eventType);
  if (!page || !content) notFound();

  const date = formatDate(content.startsAt);
  const title = `${displayTitle(content, copy.invitation.ampersand)}: ${copy.publicPage.titleSuffix}`;
  const description = `${date.weekday}, ${date.day} ${date.month} ${date.year} · ${content.venue.city}`;
  // Drafts get no image: crawlers never see them, and the image URL is cached publicly.
  const image = page.isDraftPreview
    ? undefined
    : { url: `/i/${slug}/og?v=${imageVersion(page.updatedAt)}`, ...OG_SIZE, alt: copy.publicPage.ogAlt };

  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
    openGraph: {
      type: "website",
      siteName: copy.meta.siteName,
      locale: "ka_GE",
      url: `/i/${slug}`,
      title,
      description,
      images: image && [image],
    },
    twitter: { card: "summary_large_image", title, description, images: image && [image] },
  };
}

export default function InvitationPage({ params }: Props) {
  return (
    <Suspense fallback={<div data-surface="light" className="min-h-svh bg-bg" />}>
      <Invitation slug={params.then((p) => p.slug)} />
    </Suspense>
  );
}

/**
 * Everyone with the link answers through the same form. The owner's unpublished preview shows the
 * form in demo mode: it works, but nothing is sent.
 */
async function Invitation({ slug: slugPromise }: { slug: Promise<string> }) {
  const slug = await slugPromise;
  const page = await resolveInvitationPage(slug);
  const content = page && pageContent(page.content, page.isDraftPreview, page.updatedAt, page.eventType);
  if (!page || !content) notFound();
  const rsvp = await rsvpFor(slug, page.maxPartySize, content.rsvpDeadline, page.isDraftPreview);

  return (
    <main>
      {page.isDraftPreview && (
        <p role="status" className="draft-ribbon">
          {copy.publicPage.ribbon}
        </p>
      )}
      <InvitationRenderer
        templateId={page.templateId}
        content={content}
        eventType={page.eventType}
        rsvp={rsvp}
      />
    </main>
  );
}

/** The RSVP form's settings. The deadline depends on today's date, so this renders per request. */
async function rsvpFor(slug: string, maxPartySize: number, deadline: string, isDraftPreview: boolean): Promise<InvitationRsvp> {
  await connection();
  return {
    slug,
    maxPartySize,
    closed: !rsvpOpen(deadline, Date.now()),
    submit: isDraftPreview ? "demo" : "live",
  };
}
