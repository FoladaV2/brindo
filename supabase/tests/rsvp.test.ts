import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { copy } from "@content/copy.ka";
import { POST } from "@/app/api/rsvp/route";
import { hashEditToken, RSVP_RATE_LIMIT } from "@/lib/responses/rsvp";
import type { Json } from "@/lib/supabase/database.types";
import { admin, anon, createCouple, deleteCouple, must, PERMISSION_DENIED, uniqueSlug, type Couple } from "./helpers";

// The RSVP route handler, called directly against the database. Guests have no session and there is
// one link per invitation: anyone with it may answer, and an edit token lets the same phone change
// its answer. Every case below is about what that link and that token can and can't do.

const CHECK = "23514";

let a: Couple;
let b: Couple;
type Fixture = { slug: string; invitationId: string };
let open: Fixture; // A's published invitation, deadline ahead, up to 3 people per answer
let other: Fixture; // B's published invitation
let draft: Fixture; // A's unpublished invitation
let past: Fixture; // A's published invitation, deadline passed

/** Sample content with the event moved; a JSON round trip turns the readonly copy into plain Json. */
const contentOn = (startsAt: string, rsvpDeadline: string): Json => JSON.parse(JSON.stringify({ ...copy.samples.birthday, startsAt, rsvpDeadline }));
const future = contentOn("2099-09-04T19:00", "2099-08-20");
const expired = contentOn("2020-09-04T19:00", "2020-08-20");

async function arrange(host: Couple, content: Json, published: boolean): Promise<Fixture> {
  const slug = uniqueSlug("rsvp");
  const invitation = must(
    await admin()
      .from("invitations")
      .insert({
        owner_id: host.id,
        slug,
        template_id: "lumiere",
        event_type: "birthday",
        max_party_size: 3,
        content,
        ...(published ? { status: "published", paid_at: new Date().toISOString() } : {}),
      })
      .select()
      .single(),
  );
  return { slug, invitationId: invitation.id };
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

const answer = (slug: string, extra: Record<string, unknown> = {}) => ({
  slug,
  firstName: "ნინო",
  lastName: "ბერიძე-ჩიქოვანი",
  attending: true,
  partySize: 3,
  ...extra,
});

const rowsFor = async (invitationId: string) => must(await admin().from("responses").select("*").eq("invitation_id", invitationId));

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

describe("a guest with the invitation link", () => {
  it("answers once, gets an edit token, and changes the same answer with it", async () => {
    const yes = await rsvp(answer(open.slug));
    expect(yes.status).toBe(200);
    const first = await yes.json();
    expect(first).toMatchObject({ ok: true, answer: { firstName: "ნინო", attending: true, partySize: 3 } });
    expect(first.editToken).toMatch(/^[A-Za-z0-9_-]{32}$/);

    const no = await rsvp(answer(open.slug, { attending: false, partySize: null, editToken: first.editToken }));
    expect(no.status).toBe(200);
    const second = await no.json();
    expect(second).toEqual({ ok: true, answer: { firstName: "ნინო", lastName: "ბერიძე-ჩიქოვანი", attending: false, partySize: null } });
    expect(second.editToken).toBeUndefined();

    const rows = (await rowsFor(open.invitationId)).filter((r) => r.edit_token_hash === hashEditToken(first.editToken));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ attending: false, party_size: null });
  });

  it("stores only the token's hash", async () => {
    const res = await rsvp(answer(open.slug, { firstName: "გიორგი" }));
    const { editToken } = await res.json();
    const rows = await rowsFor(open.invitationId);
    expect(rows.some((r) => r.edit_token_hash === editToken)).toBe(false);
    expect(rows.some((r) => r.edit_token_hash === hashEditToken(editToken))).toBe(true);
  });

  it("creates a new answer with a token from another invitation, never touching that one", async () => {
    const theirs = await (await rsvp(answer(other.slug, { firstName: "თამარ" }))).json();
    const before = await rowsFor(other.invitationId);
    const mine = await rsvp(answer(open.slug, { firstName: "ლევან", editToken: theirs.editToken }));
    expect(mine.status).toBe(200);
    expect((await mine.json()).editToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(await rowsFor(other.invitationId)).toEqual(before);
  });

  it.each([
    ["more people than the invitation allows", 4],
    ["nobody", 0],
  ])("cannot say yes for %s", async (_label, partySize) => {
    const res = await rsvp(answer(open.slug, { partySize }));
    expect([400, 422]).toContain(res.status);
  });

  it("cannot answer after the deadline", async () => {
    const res = await rsvp(answer(past.slug));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ ok: false, error: "closed" });
    expect(await rowsFor(past.invitationId)).toHaveLength(0);
  });
});

describe("a link that does not fit", () => {
  it.each([
    ["an unpublished invitation", () => draft.slug],
    ["an unknown slug", () => "no-such-invitation"],
  ])("gets the same 404 for %s", async (_label, slug) => {
    const res = await rsvp(answer(slug()));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, error: "not_found" });
  });

  it("writes nothing for an unpublished invitation", async () => {
    await rsvp(answer(draft.slug));
    expect(await rowsFor(draft.invitationId)).toHaveLength(0);
  });
});

describe("malformed requests", () => {
  it.each([
    ["not JSON", "{nope"],
    ["no surname", { slug: "x-y-z", firstName: "ნინო", attending: true, partySize: 1 }],
    ["markup in a name", { slug: "x-y-z", firstName: "<b>x</b>", lastName: "y", attending: true, partySize: 1 }],
    ["a body that is too large", JSON.stringify({ ...answer("x-y-z"), padding: "x".repeat(4000) })],
  ])("answers 400 for %s", async (_label, body) => {
    const res = await rsvp(body);
    expect(res.status).toBe(400);
  });

  it("ignores client-sent ids", async () => {
    const res = await rsvp({ ...answer(open.slug, { firstName: "ანა" }), invitationId: other.invitationId, id: "x" });
    expect(res.status).toBe(200);
    expect((await rowsFor(other.invitationId)).some((r) => r.first_name === "ანა")).toBe(false);
  });
});

describe("abuse limits", () => {
  it("rate-limits one address on one invitation", async () => {
    const address = ip();
    let last: Response | undefined;
    for (let i = 0; i <= RSVP_RATE_LIMIT.requests; i++) last = await rsvp(answer(open.slug, { firstName: `ა${"ა".repeat(i % 5)}` }), address);
    expect(last?.status).toBe(429);
    expect(last?.headers.get("Retry-After")).toMatch(/^\d+$/);
  });
});

describe("the responses table", () => {
  it("is closed to anonymous clients", async () => {
    const { error } = await anon().from("responses").insert({ invitation_id: open.invitationId, first_name: "x", attending: false, edit_token_hash: "0".repeat(64) });
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it("enforces the party-size cap and the coming/count rule in the database too", async () => {
    const base = { invitation_id: open.invitationId, first_name: "x", edit_token_hash: hashEditToken(randomBytes(24).toString("base64url")) };
    const over = await admin().from("responses").insert({ ...base, attending: true, party_size: 4 });
    const noCount = await admin().from("responses").insert({ ...base, attending: true, party_size: null });
    const countWhenNo = await admin().from("responses").insert({ ...base, attending: false, party_size: 2 });
    expect(over.error?.code).toBe(CHECK);
    expect(noCount.error?.code).toBe(CHECK);
    expect(countWhenNo.error?.code).toBe(CHECK);
  });
});
