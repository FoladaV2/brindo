import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createDodoProvider, type DodoConfig } from "./dodo";

const SECRET = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
const NOW_S = 1_800_000_000;
const ORDER = "6f1c2b9e-4a5d-4c3b-8e2f-1a2b3c4d5e6f";
const INVITATION = "0b7e8d6c-5f4e-4d3c-9b2a-7e6d5c4b3a29";

const provider = (overrides: Partial<DodoConfig> = {}) =>
  createDodoProvider({ apiKey: "sk_test", webhookKey: SECRET, environment: "test_mode", now: () => NOW_S * 1000, ...overrides });

/** Signs like Dodo (Standard Webhooks). The test vector below pins this to the published spec. */
function signed(body: string, { id = "msg_1", at = NOW_S, secret = SECRET } = {}) {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signature = createHmac("sha256", key).update(`${id}.${at}.${body}`).digest("base64");
  return new Headers({ "webhook-id": id, "webhook-timestamp": String(at), "webhook-signature": `v1,${signature}` });
}

const event = (type: string, data: Record<string, unknown>) =>
  JSON.stringify({ business_id: "bus_1", type, timestamp: "2026-10-28T12:00:00Z", data: { payload_type: "Payment", ...data } });

const paymentData = (overrides: Record<string, unknown> = {}) => ({
  payment_id: "pay_123",
  total_amount: 4900,
  tax: 0,
  currency: "GEL",
  brand_id: "brnd_brindo",
  metadata: { order_id: ORDER, invitation_id: INVITATION },
  ...overrides,
});

describe("verifyWebhook", () => {
  it("accepts the Standard Webhooks test vector", () => {
    const p = provider({ now: () => 1614265330 * 1000 });
    const headers = new Headers({
      "webhook-id": "msg_p5jXN8AQM9LWM0D4loKWxJek",
      "webhook-timestamp": "1614265330",
      "webhook-signature": "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
    });
    expect(p.verifyWebhook('{"test": 2432232314}', headers)).toBe(true);
    expect(p.verifyWebhook('{"test": 2432232315}', headers)).toBe(false);
  });

  it("accepts a correct signature among several", () => {
    const body = event("payment.succeeded", paymentData());
    const headers = signed(body);
    headers.set("webhook-signature", `v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= ${headers.get("webhook-signature")}`);
    expect(provider().verifyWebhook(body, headers)).toBe(true);
  });

  it("rejects a body changed after signing (amount or invitation)", () => {
    const body = event("payment.succeeded", paymentData());
    const headers = signed(body);
    expect(provider().verifyWebhook(body.replace("4900", "100"), headers)).toBe(false);
    expect(provider().verifyWebhook(body.replace(INVITATION, ORDER), headers)).toBe(false);
  });

  it("rejects another secret, stale or future timestamps, and missing or unknown signatures", () => {
    const body = event("payment.succeeded", paymentData());
    const p = provider();
    expect(p.verifyWebhook(body, signed(body, { secret: "whsec_c2VjcmV0LWZvci1zb21lb25lLWVsc2UtMTIzNA==" }))).toBe(false);
    expect(p.verifyWebhook(body, signed(body, { at: NOW_S - 301 }))).toBe(false);
    expect(p.verifyWebhook(body, signed(body, { at: NOW_S + 301 }))).toBe(false);
    expect(p.verifyWebhook(body, signed(body, { at: NOW_S - 299 }))).toBe(true);

    const missing = signed(body);
    missing.delete("webhook-signature");
    expect(p.verifyWebhook(body, missing)).toBe(false);

    const otherVersion = signed(body);
    otherVersion.set("webhook-signature", otherVersion.get("webhook-signature")!.replace("v1,", "v2,"));
    expect(p.verifyWebhook(body, otherVersion)).toBe(false);
  });
});

describe("parseEvent", () => {
  const parse = (body: string, p = provider()) => p.parseEvent(body, signed(body, { id: "evt_1" }));

  it("reads a successful payment started by Brindo's checkout", () => {
    expect(parse(event("payment.succeeded", paymentData({ tax: 748 })))).toEqual({
      id: "evt_1",
      type: "payment.succeeded",
      kind: "payment_succeeded",
      orderId: ORDER,
      invitationId: INVITATION,
      paymentId: "pay_123",
      amount: 4900,
      tax: 748,
      currency: "GEL",
    });
  });

  it("treats failed and cancelled payments as failures", () => {
    expect(parse(event("payment.failed", paymentData()))).toMatchObject({ kind: "payment_failed", orderId: ORDER });
    expect(parse(event("payment.cancelled", paymentData()))).toMatchObject({ kind: "payment_failed", orderId: ORDER });
  });

  it("only records payments that aren't Brindo's: no order metadata, or another brand", () => {
    expect(parse(event("payment.succeeded", paymentData({ metadata: {} })))).toMatchObject({ kind: "other", paymentId: "pay_123" });
    expect(parse(event("payment.succeeded", paymentData({ metadata: { order_id: "x", invitation_id: INVITATION } })))).toMatchObject({
      kind: "other",
    });
    const brindoOnly = provider({ brandId: "brnd_brindo" });
    expect(parse(event("payment.succeeded", paymentData({ brand_id: "brnd_tergi" })), brindoOnly)).toMatchObject({ kind: "other" });
    expect(parse(event("payment.succeeded", paymentData()), brindoOnly)).toMatchObject({ kind: "payment_succeeded" });
  });

  it("reads refunds; anything but an explicit full refund counts as partial", () => {
    const refund = (data: Record<string, unknown>) => event("refund.succeeded", { refund_id: "ref_1", payment_id: "pay_123", ...data });
    expect(parse(refund({ is_partial: false }))).toMatchObject({ kind: "refund_succeeded", paymentId: "pay_123", partial: false });
    expect(parse(refund({ is_partial: true }))).toMatchObject({ partial: true });
    expect(parse(refund({}))).toMatchObject({ partial: true });
  });

  it("records disputes and unknown events without acting on them", () => {
    expect(parse(event("dispute.opened", { dispute_id: "dsp_1", payment_id: "pay_123" }))).toMatchObject({
      kind: "other",
      type: "dispute.opened",
      paymentId: "pay_123",
    });
    expect(parse(event("subscription.active", {}))).toMatchObject({ kind: "other", paymentId: null });
  });

  it("returns null for bodies that are not events", () => {
    expect(parse("not json")).toBeNull();
    expect(parse(JSON.stringify({ hello: "world" }))).toBeNull();
    const body = event("payment.succeeded", paymentData());
    expect(provider().parseEvent(body, new Headers())).toBeNull();
  });
});

describe("createCheckout", () => {
  const ok = () =>
    vi.fn<typeof fetch>(async () => Response.json({ session_id: "cks_1", checkout_url: "https://test.checkout.dodopayments.com/session/cks_1" }));
  const request = {
    orderId: ORDER,
    invitationId: INVITATION,
    productId: "pdt_brindo",
    returnUrl: "https://brindo.ge/dashboard/invitations/x/done",
    cancelUrl: "https://brindo.ge/dashboard/invitations/x/edit",
    customerEmail: "couple@example.com",
  };

  it("creates a session for the configured product with the order in metadata", async () => {
    const fetch = ok();
    const session = await provider({ fetch }).createCheckout(request);
    expect(session).toEqual({ sessionId: "cks_1", url: "https://test.checkout.dodopayments.com/session/cks_1" });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://test.dodopayments.com/checkouts");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer sk_test");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      product_cart: [{ product_id: "pdt_brindo", quantity: 1 }],
      customer: { email: "couple@example.com" },
      return_url: request.returnUrl,
      cancel_url: request.cancelUrl,
      metadata: { order_id: ORDER, invitation_id: INVITATION },
      feature_flags: { allow_currency_selection: false, allow_discount_code: false },
    });
    // The price is the product's; the session never names an amount.
    expect(JSON.stringify(body)).not.toMatch(/amount/);
  });

  it("uses the live host in live mode", async () => {
    const fetch = ok();
    await provider({ fetch, environment: "live_mode" }).createCheckout(request);
    expect(fetch.mock.calls[0][0]).toBe("https://live.dodopayments.com/checkouts");
  });

  it("fails on an error status or a response without an https checkout url", async () => {
    const refused = vi.fn<typeof fetch>(async () => new Response("bad product", { status: 422 }));
    await expect(provider({ fetch: refused }).createCheckout(request)).rejects.toThrow(/422/);
    const insecure = vi.fn<typeof fetch>(async () => Response.json({ session_id: "cks_1", checkout_url: "http://evil.example" }));
    await expect(provider({ fetch: insecure }).createCheckout(request)).rejects.toThrow();
  });
});
