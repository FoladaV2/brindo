import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDodoProvider } from "./dodo";
import type { PaymentEvent, PaymentProvider } from "./provider";
import { handlePaymentWebhook, MAX_WEBHOOK_BYTES, type ApplyResult } from "./webhook";

const succeeded: PaymentEvent = {
  id: "evt_1",
  type: "payment.succeeded",
  kind: "payment_succeeded",
  orderId: "6f1c2b9e-4a5d-4c3b-8e2f-1a2b3c4d5e6f",
  invitationId: "0b7e8d6c-5f4e-4d3c-9b2a-7e6d5c4b3a29",
  paymentId: "pay_1",
  amount: 4900,
  tax: null,
  currency: "GEL",
};

function mockProvider(overrides: Partial<PaymentProvider> = {}): PaymentProvider {
  return {
    name: "dodo",
    createCheckout: vi.fn(),
    verifyWebhook: vi.fn(() => true),
    parseEvent: vi.fn(() => succeeded),
    ...overrides,
  };
}

const post = (body = "{}", headers: Record<string, string> = {}) =>
  new Request("https://brindo.ge/api/webhooks/dodo", { method: "POST", body, headers });

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("handlePaymentWebhook", () => {
  it("applies a verified event and refreshes the published invitation", async () => {
    const apply = vi.fn(async (): Promise<ApplyResult> => ({ outcome: "published", slug: "ana-da-luka-x1y2" }));
    const onPublished = vi.fn();
    const response = await handlePaymentWebhook(post(), { provider: mockProvider(), apply, onPublished });

    expect(response.status).toBe(200);
    expect(apply).toHaveBeenCalledWith(succeeded);
    expect(onPublished).toHaveBeenCalledWith("ana-da-luka-x1y2");
  });

  it("answers 200 to a replayed event and refreshes nothing", async () => {
    const apply = vi.fn(async (): Promise<ApplyResult> => ({ outcome: "duplicate" }));
    const onPublished = vi.fn();
    const response = await handlePaymentWebhook(post(), { provider: mockProvider(), apply, onPublished });
    expect(response.status).toBe(200);
    expect(onPublished).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature before reading the event or touching the database", async () => {
    const provider = mockProvider({ verifyWebhook: vi.fn(() => false) });
    const apply = vi.fn();
    const response = await handlePaymentWebhook(post(), { provider, apply });

    expect(response.status).toBe(401);
    expect(provider.parseEvent).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });

  it("verifies the exact raw body it received", async () => {
    const provider = mockProvider();
    const raw = '{"type":"payment.succeeded",  "data": {}}';
    await handlePaymentWebhook(post(raw), { provider, apply: async () => ({ outcome: "recorded" }) });
    expect(provider.verifyWebhook).toHaveBeenCalledWith(raw, expect.any(Headers));
  });

  it("refuses oversized bodies without verifying them", async () => {
    const provider = mockProvider();
    const big = post("x".repeat(MAX_WEBHOOK_BYTES + 1));
    const response = await handlePaymentWebhook(big, { provider, apply: vi.fn() });
    expect(response.status).toBe(413);
    expect(provider.verifyWebhook).not.toHaveBeenCalled();
  });

  it("answers 400 to a signed body that is not an event", async () => {
    const apply = vi.fn();
    const response = await handlePaymentWebhook(post(), { provider: mockProvider({ parseEvent: () => null }), apply });
    expect(response.status).toBe(400);
    expect(apply).not.toHaveBeenCalled();
  });

  it("answers 500 when the event could not be recorded, so the provider retries", async () => {
    const apply = vi.fn(async () => {
      throw new Error("database unavailable");
    });
    const response = await handlePaymentWebhook(post(), { provider: mockProvider(), apply });
    expect(response.status).toBe(500);
  });

  it("flags refunds, disputes and mismatches for review without publishing", async () => {
    const onPublished = vi.fn();
    for (const outcome of ["order_refunded", "amount_mismatch", "paid_already_published"]) {
      const apply = async (): Promise<ApplyResult> => ({ outcome, slug: outcome === "paid_already_published" ? "s" : null });
      expect((await handlePaymentWebhook(post(), { provider: mockProvider(), apply, onPublished })).status).toBe(200);
    }
    const dispute: PaymentEvent = { id: "evt_d", type: "dispute.opened", kind: "other", paymentId: "pay_1" };
    await handlePaymentWebhook(post(), {
      provider: mockProvider({ parseEvent: () => dispute }),
      apply: async () => ({ outcome: "recorded" }),
      onPublished,
    });

    const warnings = vi.mocked(console.warn).mock.calls.map(([message]) => String(message));
    expect(warnings).toHaveLength(4);
    expect(warnings.every((m) => m.startsWith("[payments] NEEDS REVIEW"))).toBe(true);
    // Only the already-published case refreshes the page (it is live either way); nothing unpublishes.
    expect(onPublished).toHaveBeenCalledTimes(1);
  });
});

describe("handlePaymentWebhook with real Dodo signatures", () => {
  const secret = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
  const provider = createDodoProvider({ apiKey: "sk_test", webhookKey: secret, environment: "test_mode" });

  function signedRequest(body: string) {
    const at = Math.floor(Date.now() / 1000);
    const key = Buffer.from(secret.slice("whsec_".length), "base64");
    const signature = createHmac("sha256", key).update(`evt_9.${at}.${body}`).digest("base64");
    return (sent = body) =>
      post(sent, { "webhook-id": "evt_9", "webhook-timestamp": String(at), "webhook-signature": `v1,${signature}` });
  }

  const body = JSON.stringify({
    type: "payment.succeeded",
    data: {
      payment_id: "pay_9",
      total_amount: 4900,
      currency: "GEL",
      metadata: { order_id: succeeded.orderId, invitation_id: succeeded.invitationId },
    },
  });

  it("passes a genuine event through with the signed amount and invitation", async () => {
    const apply = vi.fn(async (): Promise<ApplyResult> => ({ outcome: "published", slug: "s" }));
    const response = await handlePaymentWebhook(signedRequest(body)(), { provider, apply });
    expect(response.status).toBe(200);
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ amount: 4900, invitationId: succeeded.invitationId }));
  });

  it("rejects a tampered amount or invitation id: the database is never reached", async () => {
    const apply = vi.fn();
    const send = signedRequest(body);
    const cheaper = await handlePaymentWebhook(send(body.replace('"total_amount":4900', '"total_amount":100')), { provider, apply });
    const otherInvitation = await handlePaymentWebhook(send(body.replace(succeeded.invitationId, "11111111-2222-4333-8444-555555555555")), {
      provider,
      apply,
    });
    expect(cheaper.status).toBe(401);
    expect(otherInvitation.status).toBe(401);
    expect(apply).not.toHaveBeenCalled();
  });
});
