import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { copy } from "@content/copy.ka";
import type { PaymentEvent, PaymentProvider } from "@/lib/payments/provider";
import { applyPaymentEvent, createOrder } from "@/lib/payments/store";
import { handlePaymentWebhook } from "@/lib/payments/webhook";
import type { Json } from "@/lib/supabase/database.types";
import { admin, createCouple, deleteCouple, must, PERMISSION_DENIED, uniqueSlug, type Couple } from "./helpers";

// The webhook handler and apply_payment_event against the real database. The provider is mocked:
// its signature check says yes or no, and its parser returns the event under test.

const PRICE = { amount: 4900, currency: "GEL" };
const content = JSON.parse(JSON.stringify(copy.samples.short)) as Json;

let a: Couple;
let b: Couple;

beforeAll(async () => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  [a, b] = await Promise.all([createCouple("pay-a"), createCouple("pay-b")]);
});
afterAll(async () => {
  await Promise.all([deleteCouple(a), deleteCouple(b)]);
  vi.restoreAllMocks();
});

type Fixture = { invitationId: string; orderId: string };

async function draftWithOrder(couple: Couple, published = false): Promise<Fixture> {
  const invitation = must(
    await admin()
      .from("invitations")
      .insert({
        owner_id: couple.id,
        slug: uniqueSlug("pay"),
        template_id: "lumiere",
        content,
        ...(published ? { status: "published", paid_at: "2026-01-01T00:00:00Z" } : {}),
      })
      .select("id")
      .single(),
  );
  const orderId = await createOrder({ invitationId: invitation.id, ...PRICE, refCode: "ANA_2026" });
  return { invitationId: invitation.id, orderId };
}

const eventId = () => `evt_${randomBytes(8).toString("hex")}`;
const paymentId = () => `pay_${randomBytes(8).toString("hex")}`;

type Succeeded = Extract<PaymentEvent, { kind: "payment_succeeded" }>;

function succeeded(f: Fixture, overrides: Partial<Succeeded> = {}): Succeeded {
  return {
    id: eventId(),
    type: "payment.succeeded",
    kind: "payment_succeeded",
    orderId: f.orderId,
    invitationId: f.invitationId,
    paymentId: paymentId(),
    amount: PRICE.amount,
    tax: null,
    currency: PRICE.currency,
    ...overrides,
  };
}

function provider(event: PaymentEvent, signatureValid = true): PaymentProvider {
  return {
    name: "dodo",
    createCheckout: vi.fn(),
    verifyWebhook: () => signatureValid,
    parseEvent: () => event,
  };
}

async function deliver(event: PaymentEvent, signatureValid = true) {
  const request = new Request("http://localhost/api/webhooks/dodo", { method: "POST", body: JSON.stringify({ any: "body" }) });
  return handlePaymentWebhook(request, { provider: provider(event, signatureValid), apply: applyPaymentEvent });
}

const invitation = async (id: string) => must(await admin().from("invitations").select("status, paid_at, updated_at").eq("id", id).single());
const order = async (id: string) =>
  must(await admin().from("orders").select("status, provider_payment_id, amount, currency, ref_code, updated_at").eq("id", id).single());
const events = async (id: string) => (await admin().from("webhook_events").select("event_id, event_type, outcome").eq("event_id", id)).data ?? [];

describe("payment webhook", () => {
  it("a valid payment marks the order paid and publishes the invitation", async () => {
    const f = await draftWithOrder(a);
    const event = succeeded(f);

    expect((await deliver(event)).status).toBe(200);

    expect(await invitation(f.invitationId)).toMatchObject({ status: "published", paid_at: expect.any(String) });
    expect(await order(f.orderId)).toMatchObject({ status: "paid", provider_payment_id: event.paymentId, amount: 4900, ref_code: "ANA_2026" });
    expect(await events(event.id)).toEqual([{ event_id: event.id, event_type: "payment.succeeded", outcome: "published" }]);
  });

  it("the same event delivered again, twice, changes nothing", async () => {
    const f = await draftWithOrder(a);
    const event = succeeded(f);
    await deliver(event);
    const [invitationBefore, orderBefore] = [await invitation(f.invitationId), await order(f.orderId)];

    const replays = [await deliver(event), await deliver(event)];

    expect(replays.map((r) => r.status)).toEqual([200, 200]);
    expect(await invitation(f.invitationId)).toEqual(invitationBefore);
    expect(await order(f.orderId)).toEqual(orderBefore);
    expect(await events(event.id)).toHaveLength(1);
  });

  it("simultaneous deliveries of one event apply it exactly once", async () => {
    const f = await draftWithOrder(a);
    const event = succeeded(f);
    const results = await Promise.all([1, 2, 3, 4].map(() => applyPaymentEvent(event)));
    expect(results.map((r) => r.outcome).sort()).toEqual(["duplicate", "duplicate", "duplicate", "published"]);
  });

  it("an invalid signature is rejected and nothing is recorded or changed", async () => {
    const f = await draftWithOrder(a);
    const event = succeeded(f);

    expect((await deliver(event, false)).status).toBe(401);

    expect(await invitation(f.invitationId)).toMatchObject({ status: "draft", paid_at: null });
    expect(await order(f.orderId)).toMatchObject({ status: "pending", provider_payment_id: null });
    expect(await events(event.id)).toEqual([]);
  });

  it("a payment for less than the order, or in another currency, does not publish", async () => {
    const cheap = await draftWithOrder(a);
    const cheapEvent = succeeded(cheap, { amount: 100 });
    expect((await deliver(cheapEvent)).status).toBe(200);
    expect(await invitation(cheap.invitationId)).toMatchObject({ status: "draft" });
    expect(await order(cheap.orderId)).toMatchObject({ status: "pending", amount: 4900 });
    expect(await events(cheapEvent.id)).toEqual([expect.objectContaining({ outcome: "amount_mismatch" })]);

    const dollars = await draftWithOrder(a);
    await deliver(succeeded(dollars, { currency: "USD" }));
    expect(await invitation(dollars.invitationId)).toMatchObject({ status: "draft" });
  });

  it("accepts the price with tax added on top", async () => {
    const f = await draftWithOrder(a);
    await deliver(succeeded(f, { amount: 4900 + 882, tax: 882 }));
    expect(await invitation(f.invitationId)).toMatchObject({ status: "published" });
  });

  it("a payment naming another couple's invitation publishes neither", async () => {
    const mine = await draftWithOrder(a);
    const theirs = await draftWithOrder(b);
    const event = succeeded(mine, { invitationId: theirs.invitationId });

    await deliver(event);

    expect(await invitation(mine.invitationId)).toMatchObject({ status: "draft" });
    expect(await invitation(theirs.invitationId)).toMatchObject({ status: "draft" });
    expect(await order(mine.orderId)).toMatchObject({ status: "pending" });
    expect(await events(event.id)).toEqual([expect.objectContaining({ outcome: "invitation_mismatch" })]);
  });

  it("a failed payment marks the order failed; a later success on another card still publishes", async () => {
    const f = await draftWithOrder(a);
    await deliver({ id: eventId(), type: "payment.failed", kind: "payment_failed", orderId: f.orderId, invitationId: f.invitationId, paymentId: paymentId() });
    expect(await order(f.orderId)).toMatchObject({ status: "failed" });
    expect(await invitation(f.invitationId)).toMatchObject({ status: "draft" });

    await deliver(succeeded(f));
    expect(await order(f.orderId)).toMatchObject({ status: "paid" });
    expect(await invitation(f.invitationId)).toMatchObject({ status: "published" });
  });

  it("a failure arriving after the payment never undoes it", async () => {
    const f = await draftWithOrder(a);
    await deliver(succeeded(f));
    await deliver({ id: eventId(), type: "payment.failed", kind: "payment_failed", orderId: f.orderId, invitationId: f.invitationId, paymentId: paymentId() });
    expect(await order(f.orderId)).toMatchObject({ status: "paid" });
    expect(await invitation(f.invitationId)).toMatchObject({ status: "published" });
  });

  it("refunds are recorded on the order and never unpublish", async () => {
    const full = await draftWithOrder(a);
    const paid = succeeded(full);
    await deliver(paid);
    await deliver({ id: eventId(), type: "refund.succeeded", kind: "refund_succeeded", paymentId: paid.paymentId, partial: false });
    expect(await order(full.orderId)).toMatchObject({ status: "refunded" });
    expect(await invitation(full.invitationId)).toMatchObject({ status: "published" });

    const partial = await draftWithOrder(a);
    const paidPartial = succeeded(partial);
    await deliver(paidPartial);
    await deliver({ id: eventId(), type: "refund.succeeded", kind: "refund_succeeded", paymentId: paidPartial.paymentId, partial: true });
    expect(await order(partial.orderId)).toMatchObject({ status: "paid" });
  });

  it("a second payment for a published invitation is recorded for review; publication is unchanged", async () => {
    const f = await draftWithOrder(a, true);
    const before = await invitation(f.invitationId);
    const event = succeeded(f);

    await deliver(event);

    expect(await invitation(f.invitationId)).toMatchObject({ status: "published", paid_at: before.paid_at });
    expect(await events(event.id)).toEqual([expect.objectContaining({ outcome: "paid_already_published" })]);
  });

  it("disputes and other events are recorded and change nothing", async () => {
    const f = await draftWithOrder(a);
    const dispute: PaymentEvent = { id: eventId(), type: "dispute.opened", kind: "other", paymentId: paymentId() };
    expect((await deliver(dispute)).status).toBe(200);
    expect(await events(dispute.id)).toEqual([{ event_id: dispute.id, event_type: "dispute.opened", outcome: "recorded" }]);
    expect(await order(f.orderId)).toMatchObject({ status: "pending" });
  });

  it("couples can neither call the payment function nor read orders or webhook events", async () => {
    const f = await draftWithOrder(a);
    const call = await a.client.rpc("apply_payment_event", {
      p_event_id: eventId(),
      p_event_type: "payment.succeeded",
      p_kind: "payment_succeeded",
      p_order_id: f.orderId,
      p_invitation_id: f.invitationId,
      p_payment_id: paymentId(),
      p_amount: 4900,
      p_tax: null,
      p_currency: "GEL",
      p_partial: null,
    });
    expect(call.error?.code).toBe(PERMISSION_DENIED);
    expect(await invitation(f.invitationId)).toMatchObject({ status: "draft" });

    expect((await a.client.from("orders").select("id")).error?.code).toBe(PERMISSION_DENIED);
    expect((await a.client.from("webhook_events").select("event_id")).error?.code).toBe(PERMISSION_DENIED);
  });
});
