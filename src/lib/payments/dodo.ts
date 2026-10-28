import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { CheckoutRequest, CheckoutSession, PaymentEvent, PaymentProvider } from "./provider";

/**
 * Dodo Payments, from their docs (checked 2026-10-28):
 * - Checkout: POST {base}/checkouts with a Bearer API key; returns session_id and checkout_url.
 *   Metadata values may be strings, numbers or booleans and come back on the payment webhook.
 * - Webhooks follow Standard Webhooks: HMAC-SHA256 over "{webhook-id}.{webhook-timestamp}.{raw body}"
 *   with the base64 secret after "whsec_"; webhook-signature holds space-separated "v1,<base64>".
 * - Amounts are integers in the currency's smallest unit (tetri for GEL), total_amount includes tax.
 */
export type DodoConfig = {
  apiKey: string;
  /** The endpoint's signing secret from Developer → Webhooks ("whsec_…"). */
  webhookKey: string;
  environment: "test_mode" | "live_mode";
  /** If set, payments for other brands on the same Dodo business are recorded but never acted on. */
  brandId?: string;
  fetch?: typeof fetch;
  /** Milliseconds since the epoch; injectable for tests. */
  now?: () => number;
};

const BASE_URL = {
  test_mode: "https://test.dodopayments.com",
  live_mode: "https://live.dodopayments.com",
} as const;

/** How far a webhook timestamp may be from our clock (the Standard Webhooks libraries' default). */
const TOLERANCE_SECONDS = 5 * 60;
const REQUEST_TIMEOUT_MS = 15_000;

const sessionResponse = z.object({
  session_id: z.string().min(1),
  checkout_url: z.url({ protocol: /^https$/ }),
});

const envelope = z.object({ type: z.string().min(1).max(100), data: z.record(z.string(), z.unknown()) });

const ourMetadata = z.object({ order_id: z.uuid(), invitation_id: z.uuid() });

const payment = z.object({
  payment_id: z.string().min(1).max(255),
  total_amount: z.number().int(),
  tax: z.number().int().nullish(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  brand_id: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});

const paymentRef = z.object({ payment_id: z.string().min(1).max(255) });
const refund = paymentRef.extend({ is_partial: z.boolean().nullish() });

export function createDodoProvider(config: DodoConfig): PaymentProvider {
  const fetchImpl = config.fetch ?? fetch;
  const now = config.now ?? Date.now;
  const signingKey = Buffer.from(config.webhookKey.replace(/^whsec_/, ""), "base64");

  return {
    name: "dodo",

    async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
      const response = await fetchImpl(`${BASE_URL[config.environment]}/checkouts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          product_cart: [{ product_id: request.productId, quantity: 1 }],
          ...(request.customerEmail ? { customer: { email: request.customerEmail } } : {}),
          return_url: request.returnUrl,
          cancel_url: request.cancelUrl,
          metadata: { order_id: request.orderId, invitation_id: request.invitationId },
          // The charge must be exactly the product's price in its own currency (GEL): no currency
          // switching, no discount codes. We collect no phone numbers.
          feature_flags: {
            allow_currency_selection: false,
            allow_discount_code: false,
            allow_phone_number_collection: false,
          },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Dodo checkout failed with ${response.status}: ${detail.slice(0, 300)}`);
      }
      const parsed = sessionResponse.safeParse(await response.json());
      if (!parsed.success) throw new Error("Dodo checkout returned an unexpected response");
      return { sessionId: parsed.data.session_id, url: parsed.data.checkout_url };
    },

    verifyWebhook(rawBody: string, headers: Headers): boolean {
      const id = headers.get("webhook-id");
      const timestamp = headers.get("webhook-timestamp");
      const signatures = headers.get("webhook-signature");
      if (!id || !timestamp || !signatures || !/^\d{1,12}$/.test(timestamp)) return false;
      if (Math.abs(now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;

      const expected = createHmac("sha256", signingKey).update(`${id}.${timestamp}.${rawBody}`).digest();
      return signatures.split(" ").some((entry) => {
        const [version, value] = entry.split(",", 2);
        if (version !== "v1" || !value) return false;
        const given = Buffer.from(value, "base64");
        return given.length === expected.length && timingSafeEqual(given, expected);
      });
    },

    parseEvent(rawBody: string, headers: Headers): PaymentEvent | null {
      const id = headers.get("webhook-id");
      if (!id || id.length > 255) return null;
      let json: unknown;
      try {
        json = JSON.parse(rawBody);
      } catch {
        return null;
      }
      const event = envelope.safeParse(json);
      if (!event.success) return null;
      const { type, data } = event.data;
      const base = { id, type };
      const other = (): PaymentEvent => {
        const ref = paymentRef.safeParse(data);
        return { ...base, kind: "other", paymentId: ref.success ? ref.data.payment_id : null };
      };

      if (type === "payment.succeeded" || type === "payment.failed" || type === "payment.cancelled") {
        const p = payment.safeParse(data);
        if (!p.success) return other();
        if (config.brandId && p.data.brand_id && p.data.brand_id !== config.brandId) return other();
        // Payments not started by Brindo's checkout (other products on the same business) carry no order.
        const meta = ourMetadata.safeParse(p.data.metadata ?? {});
        if (!meta.success) return other();
        const ids = { orderId: meta.data.order_id, invitationId: meta.data.invitation_id, paymentId: p.data.payment_id };
        if (type !== "payment.succeeded") return { ...base, kind: "payment_failed", ...ids };
        return { ...base, kind: "payment_succeeded", ...ids, amount: p.data.total_amount, tax: p.data.tax ?? null, currency: p.data.currency };
      }

      if (type === "refund.succeeded") {
        const r = refund.safeParse(data);
        if (!r.success) return other();
        // Only an explicit full refund changes the order; anything unclear is recorded as partial.
        return { ...base, kind: "refund_succeeded", paymentId: r.data.payment_id, partial: r.data.is_partial !== false };
      }

      return other();
    },
  };
}
