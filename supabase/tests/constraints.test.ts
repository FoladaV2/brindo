import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createCouple, deleteCouple, must, uniqueSlug, type Couple } from "./helpers";

const UNIQUE = "23505";
const CHECK = "23514";

let couple: Couple;
const orderIds: string[] = [];

beforeAll(async () => {
  couple = await createCouple("constraints");
});

afterAll(async () => {
  await admin().from("orders").delete().in("id", orderIds);
  await deleteCouple(couple);
});

async function newInvitation(overrides: Record<string, unknown> = {}) {
  return must(
    await admin()
      .from("invitations")
      .insert({ owner_id: couple.id, slug: uniqueSlug(), template_id: "lumiere", ...overrides })
      .select()
      .single(),
  );
}

/** 24 random bytes' SHA-256, as the RSVP route stores an edit token. */
const tokenHash = () => createHash("sha256").update(randomBytes(24)).digest("hex");

function newResponse(invitationId: string, overrides: Record<string, unknown> = {}) {
  return admin()
    .from("responses")
    .insert({ invitation_id: invitationId, first_name: "ნიკოლოზ", last_name: "ლომიძე", attending: true, party_size: 2, edit_token_hash: tokenHash(), ...overrides });
}

describe("invitations", () => {
  it("rejects a duplicate slug", async () => {
    const first = await newInvitation();
    const { error } = await admin()
      .from("invitations")
      .insert({ owner_id: couple.id, slug: first.slug, template_id: "noir" });
    expect(error?.code).toBe(UNIQUE);
  });

  it.each(["Upper-Case", "-leading", "trailing-", "a", "has space", "ნინო"])("rejects the slug %j", async (slug) => {
    const { error } = await admin().from("invitations").insert({ owner_id: couple.id, slug, template_id: "lumiere" });
    expect(error?.code).toBe(CHECK);
  });

  it("rejects an unknown status or template", async () => {
    const status = await admin()
      .from("invitations")
      .insert({ owner_id: couple.id, slug: uniqueSlug(), template_id: "lumiere", status: "live" });
    const template = await admin()
      .from("invitations")
      .insert({ owner_id: couple.id, slug: uniqueSlug(), template_id: "canva" });
    expect(status.error?.code).toBe(CHECK);
    expect(template.error?.code).toBe(CHECK);
  });

  it("requires paid_at exactly when paid or published", async () => {
    const publishedWithoutPayment = await admin()
      .from("invitations")
      .insert({ owner_id: couple.id, slug: uniqueSlug(), template_id: "lumiere", status: "published" });
    const draftWithPayment = await admin()
      .from("invitations")
      .insert({ owner_id: couple.id, slug: uniqueSlug(), template_id: "lumiere", paid_at: new Date().toISOString() });
    expect(publishedWithoutPayment.error?.code).toBe(CHECK);
    expect(draftWithPayment.error?.code).toBe(CHECK);
  });

  it("rejects content that is not a JSON object", async () => {
    const { error } = await admin()
      .from("invitations")
      .insert({ owner_id: couple.id, slug: uniqueSlug(), template_id: "lumiere", content: ["not", "an", "object"] });
    expect(error?.code).toBe(CHECK);
  });

  it("bumps updated_at on every update", async () => {
    const invitation = await newInvitation();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const updated = must(
      await admin().from("invitations").update({ content: { names: ["ა", "ბ"] } }).eq("id", invitation.id).select().single(),
    );
    expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(new Date(invitation.updated_at).getTime());
  });
});

describe("invitations: event type and party-size cap", () => {
  it("rejects an unknown event type", async () => {
    const { error } = await admin().from("invitations").insert({ owner_id: couple.id, slug: uniqueSlug(), template_id: "lumiere", event_type: "funeral" });
    expect(error?.code).toBe(CHECK);
  });

  it.each([0, 11])("rejects max_party_size %i", async (size) => {
    const { error } = await admin().from("invitations").insert({ owner_id: couple.id, slug: uniqueSlug(), template_id: "lumiere", max_party_size: size });
    expect(error?.code).toBe(CHECK);
  });
});

describe("responses", () => {
  it.each([
    ["coming with no count", { attending: true, party_size: null }],
    ["not coming with a count", { attending: false, party_size: 2 }],
    ["more people than the invitation allows", { attending: true, party_size: 7 }],
    ["a blank first name", { first_name: "   " }],
    ["an edit-token hash that is not a SHA-256", { edit_token_hash: "abc" }],
  ])("rejects %s", async (_label, overrides) => {
    const invitation = await newInvitation({ max_party_size: 6 });
    const { error } = await newResponse(invitation.id, overrides);
    expect(error?.code).toBe(CHECK);
  });

  it("rejects a reused edit-token hash", async () => {
    const invitation = await newInvitation();
    const hash = tokenHash();
    must(await newResponse(invitation.id, { edit_token_hash: hash }).select().single());
    const { error } = await newResponse(invitation.id, { edit_token_hash: hash });
    expect(error?.code).toBe(UNIQUE);
  });
});

describe("orders and webhook events", () => {
  it("rejects a duplicate provider_payment_id", async () => {
    const invitation = await newInvitation();
    const paymentId = `pay_${randomBytes(8).toString("hex")}`;
    const first = must(
      await admin()
        .from("orders")
        .insert({ invitation_id: invitation.id, amount: 4900, provider_payment_id: paymentId })
        .select()
        .single(),
    );
    orderIds.push(first.id);
    const { error } = await admin()
      .from("orders")
      .insert({ invitation_id: invitation.id, amount: 4900, provider_payment_id: paymentId });
    expect(error?.code).toBe(UNIQUE);
  });

  it("rejects bad amounts, statuses and currencies", async () => {
    const invitation = await newInvitation();
    const results = await Promise.all([
      admin().from("orders").insert({ invitation_id: invitation.id, amount: 0 }),
      admin().from("orders").insert({ invitation_id: invitation.id, amount: 4900, status: "maybe" }),
      admin().from("orders").insert({ invitation_id: invitation.id, amount: 4900, currency: "gel" }),
      admin().from("orders").insert({ invitation_id: invitation.id, amount: 4900, status: "paid" }), // no payment id
      admin().from("orders").insert({ invitation_id: invitation.id, amount: 4900, ref_code: "<script>" }),
    ]);
    for (const { error } of results) expect(error?.code).toBe(CHECK);
  });

  it("records a webhook event id only once", async () => {
    const eventId = `evt_${randomBytes(8).toString("hex")}`;
    must(await admin().from("webhook_events").insert({ event_id: eventId }).select().single());
    const { error } = await admin().from("webhook_events").insert({ event_id: eventId });
    expect(error?.code).toBe(UNIQUE);
    await admin().from("webhook_events").delete().eq("event_id", eventId);
  });
});

describe("deleting an invitation", () => {
  it("removes its answers but keeps the order record", async () => {
    const invitation = await newInvitation();
    const response = must(await newResponse(invitation.id).select().single());
    const order = must(
      await admin().from("orders").insert({ invitation_id: invitation.id, amount: 4900 }).select().single(),
    );
    orderIds.push(order.id);

    // The host deletes it themselves, through RLS.
    const deleted = await couple.client.from("invitations").delete().eq("id", invitation.id).select();
    expect(deleted.data).toHaveLength(1);

    expect(must(await admin().from("responses").select("id").eq("id", response.id))).toEqual([]);
    expect(must(await admin().from("orders").select("invitation_id").eq("id", order.id).single())).toEqual({
      invitation_id: null,
    });
  });
});
