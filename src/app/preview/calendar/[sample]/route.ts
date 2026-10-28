import { buildIcs } from "@/lib/invitations/ics";
import { calendarTitle } from "@/templates/shared/format";
import { previewEnabled, SAMPLES, type SampleId } from "../../samples";

export async function GET(_request: Request, { params }: RouteContext<"/preview/calendar/[sample]">) {
  // The URL ends in .ics so in-app browsers and download managers treat it as a calendar file.
  const sample = (await params).sample.replace(/\.ics$/, "");
  if (!previewEnabled || !Object.hasOwn(SAMPLES, sample)) return new Response("Not found", { status: 404 });

  const content = SAMPLES[sample as SampleId];
  const ics = buildIcs(content, { uid: `preview-${sample}@brindo`, title: calendarTitle(content), stamp: Date.now() });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="brindo-${sample}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
