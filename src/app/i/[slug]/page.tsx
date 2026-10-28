import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { copy } from "@content/copy.ka";
import { findGuestByToken } from "@/lib/guests/rsvp";
import { resolveInvitationPage } from "@/lib/invitations/access";
import { rsvpOpen } from "@/lib/invitations/datetime";
import { OG_SIZE } from "@/lib/invitations/og-size";
import { formatDate } from "@/templates/shared/format";
import { InvitationRenderer } from "@/templates/InvitationRenderer";
import type { InvitationGuest } from "@/templates/types";
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
  const content = page && pageContent(page.content, page.isDraftPreview, page.updatedAt);
  if (!page || !content) notFound();

  const [a, b] = content.partners;
  const date = formatDate(content.startsAt);
  const title = `${a} ${copy.invitation.ampersand} ${b}: ${copy.publicPage.titleSuffix}`;
  const description = `${date.weekday}, ${date.day} ${date.month} ${date.year} · ${content.venue.city}`;
  // Drafts get no image: crawlers never see them, and the image URL is cached publicly.
  const image = page.isDraftPreview
    ? undefined
    : { url: `/i/${slug}/og?v=${imageVersion(page.updatedAt)}`, ...OG_SIZE, alt: copy.publicPage.ogAlt };

  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false, nocache: true },
    // Personal links carry the guest's token in ?g=; never pass it on to other sites.
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

export default function InvitationPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<div data-surface="light" className="min-h-svh bg-bg" />}>
      <Invitation slug={params.then((p) => p.slug)} token={searchParams.then((s) => s.g)} />
    </Suspense>
  );
}

/**
 * The guest a personal link (?g=token) belongs to. Only published invitations take answers, so the
 * owner's draft preview stays view-only. An unknown token is treated like no token at all.
 */
async function guestFor(slug: string, token: string | string[] | undefined): Promise<InvitationGuest | undefined> {
  if (typeof token !== "string") return undefined;
  const guest = await findGuestByToken(slug, token);
  if (!guest) return undefined;
  await connection();
  return {
    name: guest.name,
    maxPartySize: guest.maxPartySize,
    rsvp: guest.rsvp,
    closed: !rsvpOpen(guest.deadline, Date.now()),
    submit: { slug, token },
  };
}

async function Invitation({ slug: slugPromise, token }: { slug: Promise<string>; token: Promise<string | string[] | undefined> }) {
  const slug = await slugPromise;
  const page = await resolveInvitationPage(slug);
  const content = page && pageContent(page.content, page.isDraftPreview, page.updatedAt);
  if (!page || !content) notFound();
  const guest = page.isDraftPreview ? undefined : await guestFor(slug, await token);

  return (
    <main>
      {page.isDraftPreview && (
        <p role="status" className="draft-ribbon">
          {copy.publicPage.ribbon}
        </p>
      )}
      <InvitationRenderer templateId={page.templateId} content={content} guest={guest} calendarHref={`/i/${slug}/calendar.ics`} />
    </main>
  );
}
