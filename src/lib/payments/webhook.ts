import "server-only";
import type { PaymentEvent, PaymentProvider } from "./provider";

/** Provider webhooks are a few kilobytes; refuse anything far larger before reading it all. */
export const MAX_WEBHOOK_BYTES = 256 * 1024;

/** What the database did with an event (see apply_payment_event in the payments migration). */
export type ApplyResult = { outcome: string; orderId?: string | null; invitationId?: string | null; slug?: string | null };

export type WebhookDeps = {
  provider: PaymentProvider;
  /** Records the event id and applies it in one transaction; "duplicate" if seen before. */
  apply(event: PaymentEvent): Promise<ApplyResult>;
  /** Called after an invitation goes live, to refresh its cached public page. */
  onPublished?(slug: string): void;
};

/** Outcomes a person should look at. Nothing here is undone automatically. */
const NEEDS_REVIEW: Record<string, string> = {
  amount_mismatch: "Paid amount or currency differs from the order. Not published.",
  invitation_mismatch: "Payment names a different invitation than its order. Not published.",
  unknown_order: "Payment for an order Brindo does not have. Not published.",
  second_payment_for_order: "A second payment for an order that was already paid. Consider refunding one.",
  paid_already_published: "Payment for an invitation that was already published. Possible double payment; consider refunding.",
  paid_invitation_missing: "Payment for an invitation that was deleted. Consider refunding.",
  ignored_refunded_order: "Payment arrived for an order that was already refunded. Nothing changed.",
  order_refunded: "Full refund. The invitation is still published: decide whether to unpublish it.",
  partial_refund_recorded: "Partial refund. The order stays paid and the invitation stays published.",
  unknown_payment: "Refund for a payment Brindo has no order for.",
};

/**
 * POST /api/webhooks/dodo. Verifies the signature over the raw body before anything else, then
 * hands the event to the database. 2xx tells the provider to stop retrying, so only a failure to
 * record the event (a database error) returns 500.
 */
export async function handlePaymentWebhook(request: Request, deps: WebhookDeps): Promise<Response> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_WEBHOOK_BYTES) return plain(413, "Too large");
  const rawBody = await request.text();
  if (rawBody.length > MAX_WEBHOOK_BYTES) return plain(413, "Too large");

  if (!deps.provider.verifyWebhook(rawBody, request.headers)) {
    console.warn("[payments] webhook rejected: invalid or expired signature");
    return plain(401, "Invalid signature");
  }

  const event = deps.provider.parseEvent(rawBody, request.headers);
  if (!event) {
    console.error("[payments] signed webhook with an unreadable body", { webhookId: request.headers.get("webhook-id") });
    return plain(400, "Unreadable event");
  }

  let result: ApplyResult;
  try {
    result = await deps.apply(event);
  } catch (error) {
    console.error("[payments] webhook could not be recorded; the provider will retry", { eventId: event.id, type: event.type, error });
    return plain(500, "Not recorded");
  }

  report(event, result);
  if ((result.outcome === "published" || result.outcome === "paid_already_published") && result.slug) {
    deps.onPublished?.(result.slug);
  }
  return new Response(null, { status: 200 });
}

function report(event: PaymentEvent, result: ApplyResult) {
  const details = {
    eventId: event.id,
    type: event.type,
    paymentId: event.paymentId,
    orderId: result.orderId ?? null,
    invitationId: result.invitationId ?? null,
    outcome: result.outcome,
  };
  const review = NEEDS_REVIEW[result.outcome] ?? (event.type.startsWith("dispute.") ? "Dispute event. The invitation is unchanged; respond in the Dodo dashboard." : null);
  if (review) console.warn(`[payments] NEEDS REVIEW: ${review}`, details);
  else console.info("[payments] webhook processed", details);
}

const plain = (status: number, body: string) => new Response(body, { status, headers: { "Content-Type": "text/plain" } });
