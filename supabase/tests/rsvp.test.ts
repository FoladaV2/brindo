import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { copy } from "@content/copy.ka";
import { POST } from "@/app/api/rsvp/route";
import { RSVP_RATE_LIMIT } from "@/lib/guests/rsvp";
import type { Json } from "@/lib/supabase/database.types";
import { admin, anon, createCouple, deleteCouple, must, PERMISSION_DENIED, uniqueSlug, type Couple } from "./helpers";

// The RSVP route handler, called directly against the database. Guests have no session: the token
// in their link is the only credential, so every case below is about what a token can and can't do.

const CHECK = "23514";

let a: Couple;
let b: Couple;
type Fixture = { slug: string; invitationId: string; guestId: string; token: string };
let open: Fixture; // A's published invitation, deadline ahead
let other: Fixture; // B's published invitation
let draft: Fixture; // A's unpublished invitation
let past: Fixture; // A's published invitation, deadline passed

/** Sample content with the event moved; a JSON round trip turns the readonly copy into plain Json. */
const contentOn = (startsAt: string, rsvpDeadline: string): Json => JSON.parse(JSON.stringify({ ...copy.samples.short, startsAt, rsvpDeadline }));
const future = contentOn("2099-09-04T19:00", "2099-08-20");
const expired = contentOn("2020-09-04T19:00", "2020-08-20");

async function arrange(couple: Couple, content: Json, published: boolean): Promise<Fixture> {
  const slug = uniqueSlug("rsvp");
  const invitation = must(
    await admin()
      .from("invitations")
      .insert({
        owner_id: couple.id,
        slug,
        template_id: "lumiere",
        content,
        ...(published ? { status: "published", paid_at: new Date().toISOString() } : {}),
      })
      .select()
      .single(),
  );
  // Guests are added the way the editor adds them: by the couple, through RLS.
  const guest = must(
    await couple.client
      .from("guests")
      .insert({ invitation_id: invitation.id, name: "ნინო ბერიძე-ჩიქოვანი", max_party_size: 3 })
      .select()
      .single(),
  );
  return { slug, invitationId: invitation.id, guestId: guest.id, token: guest.token };
}

/** A different client IP per call site, so rate limits from one test never leak into another. */
const ip = () => `198.51.100.${randomBytes(1)[0]}-${randomBytes(4).toString("hex")}`;

function rsvp(body: unknown, clientIp = ip()) {
  return POST(
    new Request("http://localhost/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": clientIp },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const rowsFor = async (guestId: string) => must(await admin().from("rsvps").select("*").eq("guest_id", guestId));

beforeAll(async () => {
  [a, b] = await Promise.all([createCouple("rsvp-a"), createCouple("rsvp-b")]);
  [open, other, draft, past] = await Promise.all([
    arrange(a, future, true),
    arrange(b, future, true),
    arrange(a, future, false),
    arrange(a, expired, true),
  ]);
});

afterAll(async () => {
  await Promise.all([deleteCouple(a), deleteCouple(b)]);
});

describe("a guest with a valid personal link", () => {
  it("can say yes, then change to no: one row, updated in place", async () => {
    const yes = await rsvp({ slug: open.slug, token: open.token, attending: true, partySize: 3 });
    expect(yes.status).toBe(200);
    expect(await yes.json()).toEqual({ ok: true, rsvp: { attending: true, partySize: 3 } });

    const no = await rsvp({ slug: open.slug, token: open.token, attending: false, partySize: 2 });
    expect(no.status).toBe(200);
    expect(await no.json()).toEqual({ ok: true, rsvp: { attending: false, partySize: 0 } });

    const rows = await rowsFor(open.guestId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ attending: false, party_size: 0 });
  });

  it.each([
    ["more people than allowed", 4],
    ["nobody", 0],
  ])("cannot say yes for %s", async (_label, partySize) => {
    const res = await rsvp({ slug: open.slug, token: open.token, attending: true, partySize });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ ok: false, error: "party_size" });
  });

  it("cannot answer after the deadline", async () => {
    const res = await rsvp({ slug: past.slug, token: past.token, attending: true, partySize: 1 });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ ok: false, error: "closed" });
    expect(await rowsFor(past.guestId)).toHaveLength(0);
  });
});

describe("a token that does not fit", () => {
  const cases = () => [
    ["an unknown token", { slug: open.slug, token: randomBytes(24).toString("base64url") }],
    ["another invitation's token", { slug: open.slug, token: other.token }],
    ["a token with the wrong invitation's slug", { slug: other.slug, token: open.token }],
    ["a token for an unpublished invitation", { slug: draft.slug, token: draft.token }],
    ["an unknown slug", { slug: "no-such-invitation", token: open.token }],
  ] as const;

  it("always gets the same 404, and writes nothing", async () => {
    const bodies = new Set<string>();
    for (const [, target] of cases()) {
      const res = await rsvp({ ...target, attending: true, partySize: 1 });
      expect(res.status).toBe(404);
      bodies.add(await res.text());
    }
    expect([...bodies]).toEqual([JSON.stringify({ ok: false, error: "not_found" })]);
    expect(await rowsFor(other.guestId)).toHaveLength(0);
    expect(await rowsFor(draft.guestId)).toHaveLength(0);
  });
});

describe("input the route never trusts", () => {
  it.each([
    ["broken JSON", "{"],
    ["a missing token", { slug: open.slug, attending: true, partySize: 1 }],
    ["a party size over six", { slug: open.slug, token: open.token, attending: true, partySize: 99 }],
    ["an oversized body", JSON.stringify({ slug: open.slug, token: open.token, attending: true, partySize: 1, pad: "x".repeat(4000) })],
  ])("rejects %s with 400", async (_label, body) => {
    const res = await rsvp(body);
    expect(res.status).toBe(400);
  });

  it("ignores a guest id sent by the client and writes only the token's own guest", async () => {
    const res = await rsvp({ slug: open.slug, token: open.token, attending: true, partySize: 1, guestId: other.guestId, guest_id: other.guestId });
    expect(res.status).toBe(200);
    expect(await rowsFor(other.guestId)).toHaveLength(0);
  });
});

describe("rate limiting", () => {
  it(`allows ${RSVP_RATE_LIMIT.requests} requests per IP and token per window, then answers 429`, async () => {
    const clientIp = ip();
    const body = { slug: open.slug, token: open.token, attending: true, partySize: 2 };
    for (let i = 0; i < RSVP_RATE_LIMIT.requests; i++) expect((await rsvp(body, clientIp)).status).toBe(200);

    const limited = await rsvp(body, clientIp);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ ok: false, error: "rate_limited" });
    expect(Number(limited.headers.get("Retry-After"))).toBeGreaterThan(0);

    // Another guest on the same network (same IP, other token) is not affected.
    expect((await rsvp({ slug: other.slug, token: other.token, attending: false, partySize: 0 }, clientIp)).status).toBe(200);
  });

  it("the counter cannot be called by guests or couples", async () => {
    const args = { p_key: "rsvp:x", p_window_start: new Date().toISOString() };
    expect((await anon().rpc("hit_rate_limit", args)).error?.code).toBe(PERMISSION_DENIED);
    expect((await a.client.rpc("hit_rate_limit", args)).error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("guests and their answers", () => {
  it("a couple cannot lower a guest's limit below what the guest confirmed", async () => {
    expect((await rsvp({ slug: other.slug, token: other.token, attending: true, partySize: 3 })).status).toBe(200);
    const lowered = await b.client.from("guests").update({ max_party_size: 2 }).eq("id", other.guestId);
    expect(lowered.error?.code).toBe(CHECK);
    must(await b.client.from("guests").update({ max_party_size: 3 }).eq("id", other.guestId).select().single());
  });

  it("a couple cannot give a guest more than six places", async () => {
    const res = await a.client.from("guests").update({ max_party_size: 7 }).eq("id", open.guestId);
    expect(res.error?.code).toBe(CHECK);
  });

  it("couple A cannot read couple B's answers or guest tokens", async () => {
    expect(must(await a.client.from("rsvps").select("*").eq("guest_id", other.guestId))).toEqual([]);
    expect(must(await a.client.from("guests").select("token").eq("id", other.guestId))).toEqual([]);
  });

  it("a pasted list keeps its order", async () => {
    const names = ["ნინო", "გიორგი", "თამარ", "ლევანი", "ანა", "ლუკა"];
    must(
      await a.client
        .from("guests")
        .insert(names.map((name) => ({ invitation_id: draft.invitationId, name, max_party_size: 1 })))
        .select(),
    );
    const listed = must(
      await a.client.from("guests").select("name").eq("invitation_id", draft.invitationId).in("name", names).order("created_at").order("id"),
    );
    expect(listed.map((g) => g.name)).toEqual(names);
  });
});
