import { renderOgImage } from "@/lib/invitations/og";
import { previewEnabled, SAMPLES, type SampleId } from "../../samples";

/** The link-preview image for a sample invitation, to check fonts and layout without a database. */
export async function GET(_request: Request, { params }: RouteContext<"/preview/og/[sample]">) {
  const { sample } = await params;
  if (!previewEnabled || !Object.hasOwn(SAMPLES, sample)) return new Response("Not found", { status: 404 });
  return renderOgImage(SAMPLES[sample as SampleId], { headers: { "Cache-Control": "no-store" } });
}
