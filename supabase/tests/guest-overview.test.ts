import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fetchGuestOverview, summarize } from "@/lib/guests/overview";
import { admin, createCouple, deleteCouple, must, PERMISSION_DENIED, uniqueSlug, type Couple } from "./helpers";

// The couple's guest overview reads guests and RSVPs through the couple's own session (RLS).

type Answer = { attending: boolean; party_size: number } | null;

let a: Couple;
let b: Couple;
let invitationA: string;
let invitationB: string;

/** An invitation with one guest per answer; the server (service role) records the answers. */
async function arrange(couple: Couple, answers: Answer[]) {
  const invitation = must(await couple.client.from("invitations").insert({ slug: uniqueSlug(), template_id: "noir" }).select().single());
  const guests = must(
    await couple.client
      .from("guests")
      .insert(answers.map((_, i) => ({ invitation_id: invitation.id, name: `სტუმარი ${i + 1}`, max_party_size: 3 })))
      .select()
      .order("created_at"),
  );
  const rsvps = answers.flatMap((answer, i) => (answer ? [{ guest_id: guests[i].id, ...answer }] : []));
  if (rsvps.length) must(await admin().from("rsvps").insert(rsvps).select());
  return invitation.id;
}

beforeAll(async () => {
  [a, b] = await Promise.all([createCouple("overview-a"), createCouple("overview-b")]);
  invitationA = await arrange(a, [{ attending: true, party_size: 3 }, { attending: false, party_size: 0 }, null]);
  invitationB = await arrange(b, [{ attending: true, party_size: 2 }, null]);
});

afterAll(async () => {
  await Promise.all([deleteCouple(a), deleteCouple(b)]);
});

describe("guest overview", () => {
  it("shows a couple their own guests with each answer, in the order added", async () => {
    const guests = await fetchGuestOverview(a.client, invitationA);
    expect(guests.map((g) => [g.name, g.status, g.partySize])).toEqual([
      ["სტუმარი 1", "confirmed", 3],
      ["სტუმარი 2", "declined", 0],
      ["სტუმარი 3", "awaiting", 0],
    ]);
    expect(summarize(guests)).toEqual({ invited: 3, confirmed: 1, headcount: 3, declined: 1, awaiting: 1 });
  });

  it("shows another couple's invitation as empty: no guests, answers or tokens", async () => {
    expect(await fetchGuestOverview(a.client, invitationB)).toEqual([]);
    expect(await fetchGuestOverview(b.client, invitationA)).toEqual([]);
  });

  it("is read-only: a couple cannot add, change or remove an answer, even for their own guests", async () => {
    const [confirmed, , awaiting] = await fetchGuestOverview(a.client, invitationA);
    const update = await a.client.from("rsvps").update({ attending: false, party_size: 0 }).eq("guest_id", confirmed.id);
    const remove = await a.client.from("rsvps").delete().eq("guest_id", confirmed.id);
    const insert = await a.client.from("rsvps").insert({ guest_id: awaiting.id, attending: true, party_size: 1 });
    for (const result of [update, remove, insert]) expect(result.error?.code).toBe(PERMISSION_DENIED);
    expect((await fetchGuestOverview(a.client, invitationA)).map((g) => g.status)).toEqual(["confirmed", "declined", "awaiting"]);
  });
});
