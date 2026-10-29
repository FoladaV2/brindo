import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  admin,
  anon,
  createCouple,
  deleteCouple,
  must,
  PERMISSION_DENIED,
  uniqueSlug,
  type Couple,
} from "./helpers";

const TABLES = ["invitations", "responses", "orders", "webhook_events", "rate_limits", "onboarding"] as const;
const SERVER_ONLY = ["responses", "orders", "webhook_events", "rate_limits"] as const;

type Fixture = { invitationId: string; responseId: string };

let a: Couple;
let b: Couple;
let fa: Fixture;
let fb: Fixture;
const eventId = `evt_${randomBytes(8).toString("hex")}`;
const rateKey = `rsvp:${randomBytes(8).toString("hex")}`;
const orderIds: string[] = [];

const tokenHash = () => createHash("sha256").update(randomBytes(24)).digest("hex");

/** Each host builds their own invitation through RLS; the RSVP route (service role) records an answer. */
async function arrange(host: Couple): Promise<Fixture> {
  const invitation = must(
    await host.client
      .from("invitations")
      .insert({ slug: uniqueSlug(), template_id: "lumiere", event_type: "birthday", content: { title: "ანას 30" } })
      .select()
      .single(),
  );
  const response = must(
    await admin()
      .from("responses")
      .insert({ invitation_id: invitation.id, first_name: "თამარ", last_name: "ბერიძე", attending: true, party_size: 2, edit_token_hash: tokenHash() })
      .select()
      .single(),
  );
  const order = must(await admin().from("orders").insert({ invitation_id: invitation.id, amount: 4900 }).select().single());
  orderIds.push(order.id);
  return { invitationId: invitation.id, responseId: response.id };
}

beforeAll(async () => {
  [a, b] = await Promise.all([createCouple("rls-a"), createCouple("rls-b")]);
  [fa, fb] = await Promise.all([arrange(a), arrange(b)]);
  must(await admin().from("webhook_events").insert({ event_id: eventId }).select().single());
  must(
    await admin().from("rate_limits").insert({ key: rateKey, window_start: new Date().toISOString(), count: 1 }).select().single(),
  );
});

afterAll(async () => {
  await admin().from("orders").delete().in("id", orderIds);
  await admin().from("webhook_events").delete().eq("event_id", eventId);
  await admin().from("rate_limits").delete().eq("key", rateKey);
  await Promise.all([deleteCouple(a), deleteCouple(b)]);
});

describe("anonymous visitors", () => {
  it.each(TABLES)("cannot select from %s", async (table) => {
    const { data, error } = await anon().from(table).select("*");
    expect(error?.code).toBe(PERMISSION_DENIED);
    expect(data).toBeNull();
  });

  it.each(TABLES)("cannot insert into %s", async (table) => {
    const { error } = await anon().from(table).insert({} as never);
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it("cannot update or delete invitations or answers", async () => {
    const update = await anon().from("invitations").update({ content: {} }).eq("id", fb.invitationId);
    const remove = await anon().from("invitations").delete().eq("id", fb.invitationId);
    const removeAnswer = await anon().from("responses").delete().eq("id", fb.responseId);
    expect(update.error?.code).toBe(PERMISSION_DENIED);
    expect(remove.error?.code).toBe(PERMISSION_DENIED);
    expect(removeAnswer.error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("a host's own data (positive control)", () => {
  it("can read their invitation and its answers", async () => {
    const invitation = await a.client.from("invitations").select("id, event_type, max_party_size").eq("id", fa.invitationId);
    const responses = await a.client.from("responses").select("id, first_name").eq("invitation_id", fa.invitationId);
    expect(invitation.data).toEqual([{ id: fa.invitationId, event_type: "birthday", max_party_size: 6 }]);
    expect(responses.data).toHaveLength(1);
  });

  it("can update their invitation's content, event type and party-size cap", async () => {
    const invitation = await a.client
      .from("invitations")
      .update({ content: { title: "ანას 31" }, event_type: "anniversary", max_party_size: 4 })
      .eq("id", fa.invitationId)
      .select();
    expect(invitation.data).toHaveLength(1);
  });

  it("can delete an answer to their own invitation, and the invitation", async () => {
    const inv = must(await a.client.from("invitations").insert({ slug: uniqueSlug(), template_id: "noir" }).select().single());
    const answer = must(
      await admin()
        .from("responses")
        .insert({ invitation_id: inv.id, first_name: "დავით", last_name: "გოგოლაძე", attending: false, edit_token_hash: tokenHash() })
        .select()
        .single(),
    );
    expect((await a.client.from("responses").delete().eq("id", answer.id).select()).data).toHaveLength(1);
    expect((await a.client.from("invitations").delete().eq("id", inv.id).select()).data).toHaveLength(1);
  });

  it("sees only their own rows when listing everything", async () => {
    const invitations = must(await a.client.from("invitations").select("owner_id"));
    const responses = must(await a.client.from("responses").select("invitation_id"));
    expect(invitations.length).toBeGreaterThan(0);
    expect(invitations.every((row) => row.owner_id === a.id)).toBe(true);
    expect(responses.every((row) => row.invitation_id === fa.invitationId)).toBe(true);
  });

  it("never sees the edit-token hashes' owners: guests stay anonymous to other guests", async () => {
    const { data } = await anon().from("responses").select("edit_token_hash");
    expect(data).toBeNull();
  });
});

describe("host A against host B's data", () => {
  it("cannot select B's invitation or answers", async () => {
    const invitation = await a.client.from("invitations").select("*").eq("id", fb.invitationId);
    const byInvitation = await a.client.from("responses").select("*").eq("invitation_id", fb.invitationId);
    const byId = await a.client.from("responses").select("*").eq("id", fb.responseId);
    for (const result of [invitation, byInvitation, byId]) {
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    }
  });

  it("cannot update B's invitation", async () => {
    const before = must(await admin().from("invitations").select("*").eq("id", fb.invitationId).single());
    const result = await a.client
      .from("invitations")
      .update({ content: { hijacked: true }, slug: uniqueSlug("x"), max_party_size: 10 })
      .eq("id", fb.invitationId)
      .select();
    expect(result.data).toEqual([]);
    const after = must(await admin().from("invitations").select("*").eq("id", fb.invitationId).single());
    expect(after).toEqual(before);
  });

  it("cannot delete B's invitation", async () => {
    const result = await a.client.from("invitations").delete().eq("id", fb.invitationId).select();
    expect(result.data).toEqual([]);
    expect(must(await admin().from("invitations").select("id").eq("id", fb.invitationId))).toHaveLength(1);
  });

  it("cannot delete B's answers", async () => {
    const remove = await a.client.from("responses").delete().eq("id", fb.responseId).select();
    expect(remove.data).toEqual([]);
    expect(must(await admin().from("responses").select("id").eq("id", fb.responseId))).toHaveLength(1);
  });

  it("cannot create an invitation owned by B or hand their own over", async () => {
    const create = await a.client.from("invitations").insert({ owner_id: b.id, slug: uniqueSlug(), template_id: "lumiere" } as never);
    const transfer = await a.client.from("invitations").update({ owner_id: b.id } as never).eq("id", fa.invitationId);
    expect(create.error?.code).toBe(PERMISSION_DENIED);
    expect(transfer.error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("columns and rows only the server may set", () => {
  it("a host cannot mark their own invitation paid or published", async () => {
    const publish = await a.client
      .from("invitations")
      .update({ status: "published", paid_at: new Date().toISOString() } as never)
      .eq("id", fa.invitationId);
    const insertPublished = await a.client
      .from("invitations")
      .insert({ slug: uniqueSlug(), template_id: "lumiere", status: "published" } as never);
    expect(publish.error?.code).toBe(PERMISSION_DENIED);
    expect(insertPublished.error?.code).toBe(PERMISSION_DENIED);
    const row = must(await admin().from("invitations").select("status, paid_at").eq("id", fa.invitationId).single());
    expect(row).toEqual({ status: "draft", paid_at: null });
  });

  it("a host cannot write or change answers, not even to their own invitation", async () => {
    const insert = await a.client
      .from("responses")
      .insert({ invitation_id: fa.invitationId, first_name: "x", last_name: "y", attending: true, party_size: 1, edit_token_hash: tokenHash() });
    const update = await a.client.from("responses").update({ party_size: 10 }).eq("id", fa.responseId);
    expect(insert.error?.code).toBe(PERMISSION_DENIED);
    expect(update.error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("server-only tables", () => {
  it.each(SERVER_ONLY)("an authenticated host cannot insert into %s", async (table) => {
    const rows = {
      responses: { invitation_id: fa.invitationId, first_name: "x", last_name: "y", attending: false, edit_token_hash: tokenHash() },
      orders: { invitation_id: fa.invitationId, amount: 1, status: "paid", provider_payment_id: "forged" },
      webhook_events: { event_id: `evt_forged_${randomBytes(4).toString("hex")}` },
      rate_limits: { key: "forged", window_start: new Date().toISOString(), count: 0 },
    } as const;
    const { error } = await a.client.from(table).insert(rows[table] as never);
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it.each(["orders", "webhook_events", "rate_limits"] as const)("an authenticated host cannot read %s", async (table) => {
    const { data, error } = await a.client.from(table).select("*");
    expect(error?.code).toBe(PERMISSION_DENIED);
    expect(data).toBeNull();
  });

  it.each([
    ["orders", "id", { status: "paid" }],
    ["webhook_events", "event_id", { received_at: new Date(0).toISOString() }],
    ["rate_limits", "key", { count: 0 }],
  ] as const)("an authenticated host cannot update or delete %s", async (table, column, change) => {
    const update = await a.client.from(table).update(change as never).not(column, "is", null);
    const remove = await a.client.from(table).delete().not(column, "is", null);
    expect(update.error?.code).toBe(PERMISSION_DENIED);
    expect(remove.error?.code).toBe(PERMISSION_DENIED);
  });
});
