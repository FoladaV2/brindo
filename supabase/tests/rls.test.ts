import { randomBytes } from "node:crypto";
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

const TABLES = ["invitations", "guests", "rsvps", "orders", "webhook_events", "rate_limits"] as const;
const SERVER_ONLY = ["rsvps", "orders", "webhook_events", "rate_limits"] as const;

type Fixture = { invitationId: string; guestId: string };

let a: Couple;
let b: Couple;
let fa: Fixture;
let fb: Fixture;
const eventId = `evt_${randomBytes(8).toString("hex")}`;
const rateKey = `rsvp:${randomBytes(8).toString("hex")}`;
const orderIds: string[] = [];

/** Each couple builds their own invitation and guest through RLS; the server records an RSVP. */
async function arrange(couple: Couple): Promise<Fixture> {
  const invitation = must(
    await couple.client
      .from("invitations")
      .insert({ slug: uniqueSlug(), template_id: "lumiere", content: { names: ["ნინო", "გიორგი"] } })
      .select()
      .single(),
  );
  const guest = must(
    await couple.client
      .from("guests")
      .insert({ invitation_id: invitation.id, name: "თამარ ბერიძე", max_party_size: 2 })
      .select()
      .single(),
  );
  must(await admin().from("rsvps").insert({ guest_id: guest.id, attending: true, party_size: 2 }).select().single());
  const order = must(
    await admin().from("orders").insert({ invitation_id: invitation.id, amount: 4900 }).select().single(),
  );
  orderIds.push(order.id);
  return { invitationId: invitation.id, guestId: guest.id };
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

  it("cannot update or delete invitations", async () => {
    const update = await anon().from("invitations").update({ content: {} }).eq("id", fb.invitationId);
    const remove = await anon().from("invitations").delete().eq("id", fb.invitationId);
    expect(update.error?.code).toBe(PERMISSION_DENIED);
    expect(remove.error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("a couple's own data (positive control)", () => {
  it("can read their invitation, guests and RSVPs", async () => {
    const invitation = await a.client.from("invitations").select("id").eq("id", fa.invitationId);
    const guests = await a.client.from("guests").select("id, token").eq("invitation_id", fa.invitationId);
    const rsvps = await a.client.from("rsvps").select("guest_id").eq("guest_id", fa.guestId);
    expect(invitation.data).toHaveLength(1);
    expect(guests.data).toHaveLength(1);
    expect(guests.data?.[0].token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(rsvps.data).toHaveLength(1);
  });

  it("can update their invitation content and their guests", async () => {
    const invitation = await a.client
      .from("invitations")
      .update({ content: { names: ["ნინო", "გიორგი"], message: "განახლებული" } })
      .eq("id", fa.invitationId)
      .select();
    const guest = await a.client.from("guests").update({ name: "თამარ ჩიქოვანი" }).eq("id", fa.guestId).select();
    expect(invitation.data).toHaveLength(1);
    expect(guest.data).toHaveLength(1);
  });

  it("can delete their own guest and invitation", async () => {
    const inv = must(
      await a.client.from("invitations").insert({ slug: uniqueSlug(), template_id: "noir" }).select().single(),
    );
    const guest = must(await a.client.from("guests").insert({ invitation_id: inv.id, name: "დავითი" }).select().single());
    expect((await a.client.from("guests").delete().eq("id", guest.id).select()).data).toHaveLength(1);
    expect((await a.client.from("invitations").delete().eq("id", inv.id).select()).data).toHaveLength(1);
  });

  it("sees only their own rows when listing everything", async () => {
    const invitations = must(await a.client.from("invitations").select("owner_id"));
    const guests = must(await a.client.from("guests").select("invitation_id"));
    const rsvps = must(await a.client.from("rsvps").select("guest_id"));
    expect(invitations.length).toBeGreaterThan(0);
    expect(invitations.every((row) => row.owner_id === a.id)).toBe(true);
    expect(guests.every((row) => row.invitation_id === fa.invitationId)).toBe(true);
    expect(rsvps.map((row) => row.guest_id)).toEqual([fa.guestId]);
  });
});

describe("couple A against couple B's data", () => {
  it("cannot select B's invitation, guests or RSVPs", async () => {
    const invitation = await a.client.from("invitations").select("*").eq("id", fb.invitationId);
    const guestsByInvitation = await a.client.from("guests").select("*").eq("invitation_id", fb.invitationId);
    const guestById = await a.client.from("guests").select("*").eq("id", fb.guestId);
    const rsvps = await a.client.from("rsvps").select("*").eq("guest_id", fb.guestId);
    for (const result of [invitation, guestsByInvitation, guestById, rsvps]) {
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    }
  });

  it("cannot update B's invitation", async () => {
    const before = must(await admin().from("invitations").select("*").eq("id", fb.invitationId).single());
    const result = await a.client
      .from("invitations")
      .update({ content: { hijacked: true }, slug: uniqueSlug("x") })
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

  it("cannot update or delete B's guests", async () => {
    const before = must(await admin().from("guests").select("*").eq("id", fb.guestId).single());
    const update = await a.client.from("guests").update({ name: "hijacked", max_party_size: 6 }).eq("id", fb.guestId).select();
    const remove = await a.client.from("guests").delete().eq("id", fb.guestId).select();
    expect(update.data).toEqual([]);
    expect(remove.data).toEqual([]);
    expect(must(await admin().from("guests").select("*").eq("id", fb.guestId).single())).toEqual(before);
  });

  it("cannot add a guest to B's invitation", async () => {
    const { error } = await a.client.from("guests").insert({ invitation_id: fb.invitationId, name: "intruder" });
    expect(error?.code).toBe(PERMISSION_DENIED);
    const guests = must(await admin().from("guests").select("id").eq("invitation_id", fb.invitationId));
    expect(guests).toHaveLength(1);
  });

  it("cannot update or delete B's RSVPs", async () => {
    const before = must(await admin().from("rsvps").select("*").eq("guest_id", fb.guestId).single());
    const update = await a.client.from("rsvps").update({ attending: false, party_size: 0 }).eq("guest_id", fb.guestId);
    const remove = await a.client.from("rsvps").delete().eq("guest_id", fb.guestId);
    expect(update.error?.code).toBe(PERMISSION_DENIED);
    expect(remove.error?.code).toBe(PERMISSION_DENIED);
    expect(must(await admin().from("rsvps").select("*").eq("guest_id", fb.guestId).single())).toEqual(before);
  });

  it("cannot create an invitation owned by B", async () => {
    const { error } = await a.client
      .from("invitations")
      .insert({ owner_id: b.id, slug: uniqueSlug(), template_id: "lumiere" } as never);
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it("cannot hand their own invitation over to B or move a guest to B's invitation", async () => {
    const transfer = await a.client.from("invitations").update({ owner_id: b.id } as never).eq("id", fa.invitationId);
    const move = await a.client.from("guests").update({ invitation_id: fb.invitationId } as never).eq("id", fa.guestId);
    expect(transfer.error?.code).toBe(PERMISSION_DENIED);
    expect(move.error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("columns only the server may set", () => {
  it("a couple cannot mark their own invitation paid or published", async () => {
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

  it("a couple cannot choose or change a guest token", async () => {
    const insert = await a.client
      .from("guests")
      .insert({ invitation_id: fa.invitationId, name: "x", token: "a".repeat(32) } as never);
    const update = await a.client.from("guests").update({ token: "a".repeat(32) } as never).eq("id", fa.guestId);
    expect(insert.error?.code).toBe(PERMISSION_DENIED);
    expect(update.error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("server-only tables", () => {
  it.each(SERVER_ONLY)("an authenticated couple cannot insert into %s", async (table) => {
    const rows = {
      rsvps: { guest_id: fa.guestId, attending: true, party_size: 1 },
      orders: { invitation_id: fa.invitationId, amount: 1, status: "paid", provider_payment_id: "forged" },
      webhook_events: { event_id: `evt_forged_${randomBytes(4).toString("hex")}` },
      rate_limits: { key: "forged", window_start: new Date().toISOString(), count: 0 },
    } as const;
    const { error } = await a.client.from(table).insert(rows[table] as never);
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it.each(["orders", "webhook_events", "rate_limits"] as const)("an authenticated couple cannot read %s", async (table) => {
    const { data, error } = await a.client.from(table).select("*");
    expect(error?.code).toBe(PERMISSION_DENIED);
    expect(data).toBeNull();
  });

  it.each([
    ["orders", "id", { status: "paid" }],
    ["webhook_events", "event_id", { received_at: new Date(0).toISOString() }],
    ["rate_limits", "key", { count: 0 }],
  ] as const)("an authenticated couple cannot update or delete %s", async (table, column, change) => {
    const update = await a.client.from(table).update(change as never).not(column, "is", null);
    const remove = await a.client.from(table).delete().not(column, "is", null);
    expect(update.error?.code).toBe(PERMISSION_DENIED);
    expect(remove.error?.code).toBe(PERMISSION_DENIED);
  });
});
