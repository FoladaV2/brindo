import { findOpenInvitation, rateLimitKey, RSVP_RATE_LIMIT, submitRsvp, type RsvpError } from "@/lib/responses/rsvp";
import { rsvpRequestSchema } from "@/lib/responses/schema";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";

/** An answer is a few hundred bytes of JSON; anything much larger is not one. */
const MAX_BODY_BYTES = 2048;

const STATUS: Record<RsvpError, number> = {
  invalid: 400,
  not_found: 404,
  closed: 403,
  party_size: 422,
  full: 409,
  rate_limited: 429,
  failed: 500,
};

function fail(error: RsvpError, headers?: Record<string, string>) {
  return Response.json({ ok: false, error }, { status: STATUS[error], headers: { "Cache-Control": "no-store", ...headers } });
}

/**
 * A guest's answer through the invitation's one link: { slug, firstName, lastName, attending,
 * partySize, editToken? }. Unknown and unpublished slugs get the same 404. A new answer returns an
 * edit token; with it, the same phone can change the answer later.
 */
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return fail("invalid");
  const text = await request.text().catch(() => null);
  if (text === null || text.length > MAX_BODY_BYTES) return fail("invalid");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fail("invalid");
  }
  const parsed = rsvpRequestSchema.safeParse(body);
  if (!parsed.success) return fail("invalid");
  const input = parsed.data;

  try {
    const now = Date.now();
    const retryAfter = await hitRateLimit(rateLimitKey(clientIp(request.headers), input.slug), RSVP_RATE_LIMIT, now);
    if (retryAfter !== null) return fail("rate_limited", { "Retry-After": String(retryAfter) });

    const invitation = await findOpenInvitation(input.slug);
    if (!invitation) return fail("not_found");

    const outcome = await submitRsvp(invitation, input, now);
    if (!outcome.ok) return fail(outcome.error);
    return Response.json(outcome, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("rsvp failed", error);
    return fail("failed");
  }
}
