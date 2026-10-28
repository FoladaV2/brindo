import { getPublishedInvitation } from "@/lib/invitations/access";
import { buildIcs } from "@/lib/invitations/ics";
import { invitationContentSchema } from "@/lib/invitations/schema";
import { calendarTitle } from "@/templates/shared/format";

/** "Add to calendar" for a published invitation. Re-adding updates the same entry (stable UID). */
export async function GET(request: Request, { params }: RouteContext<"/i/[slug]/calendar.ics">) {
  const { slug } = await params;
  const invitation = await getPublishedInvitation(slug);
  const content = invitation && invitationContentSchema.safeParse(invitation.content);
  if (!invitation || !content?.success) return new Response("Not found", { status: 404 });

  const ics = buildIcs(content.data, {
    uid: `${slug}@brindo`,
    title: calendarTitle(content.data),
    stamp: Date.parse(invitation.updatedAt),
    url: new URL(`/i/${slug}`, request.url).toString(),
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
