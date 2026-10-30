import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { TemplateId } from "@/templates/registry";
import { ThanksScreen } from "@/templates/shared/ThanksScreen";
import { previewEnabled } from "./samples";

/**
 * The thank-you card after answering in a preview: ?slug= says which preview's saved answer to
 * greet. In its own file, so invitation previews don't bundle it and weigh what real pages weigh.
 */
export function ThanksPreview({ id, searchParams }: { id: TemplateId; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!previewEnabled) notFound();
  return (
    <Suspense>
      <ThanksFromQuery id={id} query={searchParams} />
    </Suspense>
  );
}

async function ThanksFromQuery({ id, query }: { id: TemplateId; query: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await query;
  return <ThanksScreen templateId={id} rsvp={{ slug: typeof slug === "string" ? slug : `preview-${id}`, submit: "demo" }} invitationHref={`/preview/${id}`} />;
}
