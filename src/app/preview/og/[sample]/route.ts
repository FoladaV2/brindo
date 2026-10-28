import { renderOgImage } from "@/lib/invitations/og";
import { templateSurface } from "@/templates/registry";
import { previewEnabled, SAMPLES, type SampleId } from "../../samples";

/**
 * The link-preview image for a sample invitation, to check fonts and layout without a database.
 * ?template=noir shows the dark card.
 */
export async function GET(request: Request, { params }: RouteContext<"/preview/og/[sample]">) {
  const { sample } = await params;
  if (!previewEnabled || !Object.hasOwn(SAMPLES, sample)) return new Response("Not found", { status: 404 });
  const template = new URL(request.url).searchParams.get("template") ?? "lumiere";
  return renderOgImage(SAMPLES[sample as SampleId], templateSurface(template), { headers: { "Cache-Control": "no-store" } });
}
