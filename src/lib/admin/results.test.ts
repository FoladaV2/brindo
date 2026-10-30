import { describe, expect, it } from "vitest";
import { summarize, type AdminEvent, type AdminUser } from "./results";

const user = (email: string): AdminUser => ({
  id: email,
  email,
  createdAt: "2027-01-01T00:00:00Z",
  lastSignInAt: null,
  onboarding: "done",
  city: null,
  planning: null,
  events: 0,
  published: 0,
  answers: 0,
  peopleComing: 0,
  unlimited: false,
});

const event = (email: string, over: Partial<AdminEvent>): AdminEvent => ({
  id: `${email}-${Math.random()}`,
  email,
  eventType: "wedding",
  templateId: "lumiere",
  title: "ნინო & გიორგი",
  startsAt: "2027-06-12T17:00",
  status: "published",
  publishedFree: false,
  createdAt: "2027-01-02T00:00:00Z",
  paidAt: "2027-01-02T00:00:00Z",
  answers: 0,
  coming: 0,
  notComing: 0,
  peopleComing: 0,
  ...over,
});

// 2027-06-01 12:00 UTC is 16:00 in Tbilisi.
const NOW = Date.UTC(2027, 5, 1, 12);

describe("summarize", () => {
  const users = [user("a@x.ge"), user("b@x.ge"), user("c@x.ge")];
  const events = [
    event("a@x.ge", { answers: 10, coming: 8, notComing: 2, peopleComing: 20 }),
    event("a@x.ge", { status: "draft", paidAt: null, eventType: "birthday", startsAt: null }),
    event("b@x.ge", { startsAt: "2027-05-30T19:00", answers: 4, coming: 2, notComing: 2, peopleComing: 5, publishedFree: true, templateId: "noir" }),
  ];
  const r = summarize(users, events, NOW);

  it("counts hosts by how far they got", () => {
    expect([r.hosts, r.hostsWithEvents, r.activeHosts]).toEqual([3, 2, 2]);
  });

  it("splits events by status and by whether they are still ahead (Tbilisi time)", () => {
    expect([r.events, r.drafts, r.published, r.publishedFree, r.upcoming]).toEqual([3, 1, 2, 1, 1]);
  });

  it("adds up the answers", () => {
    expect([r.answers, r.coming, r.notComing, r.peopleComing]).toEqual([14, 10, 4, 25]);
    expect(r.averageParty).toBe(2.5);
    expect(r.answersPerEvent).toBe(7);
    expect(r.comingShare).toBe(71);
  });

  it("breaks events down by type and template, most first", () => {
    expect(r.byType).toEqual([
      { key: "wedding", events: 2 },
      { key: "birthday", events: 1 },
    ]);
    expect(r.byTemplate[0]).toEqual({ key: "lumiere", events: 2 });
  });

  it("is all zeros without data, never NaN", () => {
    const empty = summarize([], [], NOW);
    expect([empty.averageParty, empty.answersPerEvent, empty.comingShare]).toEqual([0, 0, 0]);
  });
});
