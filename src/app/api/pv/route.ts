import { recordPageView } from "@/lib/analytics/record";

/** A page view is a path and a referrer; anything much larger is not one. */
const MAX_BODY_BYTES = 1024;

/**
 * Anonymous page views for /admin (src/lib/analytics). Always answers 204 and never says why a view
 * was or wasn't counted: the beacon fires and forgets.
 */
export async function POST(request: Request) {
  const text = await request.text().catch(() => "");
  if (text.length > 0 && text.length <= MAX_BODY_BYTES) {
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    if (body && typeof body === "object") {
      const { path, referrer } = body as Record<string, unknown>;
      await recordPageView({ path, referrer }, request.headers);
    }
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
