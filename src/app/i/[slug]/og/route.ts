import { getPublishedInvitation } from "@/lib/invitations/access";
import { renderOgImage } from "@/lib/invitations/og";
import { invitationContentSchema } from "@/lib/invitations/schema";

/**
 * The link-preview image. Published invitations only: the response is cached publicly, so a draft
 * must never be rendered here. The URL carries ?v=<last edit>, so caches can keep each version.
 */
export async function GET(_request: Request, { params }: RouteContext<"/i/[slug]/og">) {
  const { slug } = await params;
  const invitation = await getPublishedInvitation(slug);
  const content = invitation && invitationContentSchema.safeParse(invitation.content);
  if (!content?.success) return new Response("Not found", { status: 404 });

  return renderOgImage(content.data, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
  });
}
