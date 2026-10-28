import {
  findGuestByToken,
  rateLimitKey,
  RSVP_RATE_LIMIT,
  rsvpRequestSchema,
  submitRsvp,
  type RsvpError,
} from "@/lib/guests/rsvp";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";

/** An RSVP is a few dozen bytes of JSON; anything much larger is not one. */
const MAX_BODY_BYTES = 1024;

const STATUS: Record<RsvpError, number> = {
  invalid: 400,
  not_found: 404,
  closed: 403,
  party_size: 422,
  rate_limited: 429,
  failed: 500,
};

function fail(error: RsvpError, headers?: Record<string, string>) {
  return Response.json({ ok: false, error }, { status: STATUS[error], headers: { "Cache-Control": "no-store", ...headers } });
}

/**
 * A guest's answer: { slug, token, attending, partySize }. The token is the only credential. An
 * unknown token, a token for another invitation and an unpublished invitation all get the same 404.
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
    const retryAfter = await hitRateLimit(rateLimitKey(clientIp(request.headers), input.token), RSVP_RATE_LIMIT, now);
    if (retryAfter !== null) return fail("rate_limited", { "Retry-After": String(retryAfter) });

    const guest = await findGuestByToken(input.slug, input.token);
    if (!guest) return fail("not_found");

    const outcome = await submitRsvp(guest, input, now);
    if (!outcome.ok) return fail(outcome.error);
    return Response.json(outcome, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("rsvp failed", error);
    return fail("failed");
  }
}
