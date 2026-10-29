import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { copy } from "@content/copy.ka";
import { devToolsEnabled } from "@/lib/dev";
import { currentUserId, getOwnInvitation } from "@/lib/invitations/access";
import { placeholderDate } from "@/lib/invitations/preview";
import { paymentSettings } from "@/lib/payments";
import { formatPrice } from "@/lib/payments/price";
import { supabaseUrl } from "@/lib/supabase/env";
import { TEMPLATES } from "@/templates/registry";
import { DashboardShell } from "../../../shell";
import { Editor } from "./editor";

// The ownership check runs here as well as in the page: metadata blocks before the response
// starts (htmlLimitedBots in next.config.ts), so someone else's id gets a real 404 status.
export async function generateMetadata({ params }: PageProps<"/dashboard/invitations/[id]/edit">): Promise<Metadata> {
  if (!(await getOwnInvitation((await params).id))) notFound();
  return { title: copy.editor.title, robots: { index: false, follow: false } };
}

export default function EditInvitationPage({ params }: PageProps<"/dashboard/invitations/[id]/edit">) {
  return (
    <DashboardShell focus>
      <Suspense fallback={<div className="min-h-dvh" />}>
        <EditorLoader id={params.then((p) => p.id)} />
      </Suspense>
    </DashboardShell>
  );
}

async function EditorLoader({ id }: { id: Promise<string> }) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const invitation = await getOwnInvitation(await id);
  if (!invitation) notFound();

  return (
    <Editor
      id={invitation.id}
      slug={invitation.slug}
      status={invitation.status}
      templateId={invitation.templateId}
      eventType={invitation.eventType}
      maxPartySize={invitation.maxPartySize}
      templates={Object.values(TEMPLATES).map(({ id, displayName, thumbnail }) => ({
        id,
        displayName,
        thumbnail,
        tone: copy.editor.template.tones[id],
      }))}
      initialContent={invitation.content}
      userId={userId}
      supabaseUrl={supabaseUrl()}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
      fallbackDate={placeholderDate(new Date())}
      priceLabel={priceLabel()}
      devTools={devToolsEnabled}
    />
  );
}

/** Null when payments aren't configured (e.g. a local setup without Dodo keys): Pay stays disabled. */
function priceLabel(): string | null {
  try {
    return formatPrice(paymentSettings().price);
  } catch {
    return null;
  }
}
