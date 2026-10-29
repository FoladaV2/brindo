import { describe, expect, it } from "vitest";
import { summarize, type HostResponse } from "./summary";

const r = (id: string, firstName: string, lastName: string, partySize: number | null, updatedAt = "2027-05-01T10:00:00Z"): HostResponse => ({
  id,
  firstName,
  lastName,
  attending: partySize !== null,
  partySize,
  createdAt: updatedAt,
  updatedAt,
});

describe("summarize", () => {
  it("adds up every party coming, the guest included", () => {
    const s = summarize([r("1", "ნინო", "ბერიძე", 4), r("2", "გიორგი", "ლომიძე", 2), r("3", "თამარ", "კაპანაძე", null)]);
    expect(s.people).toBe(6);
    expect(s.replies).toBe(3);
    expect(s.coming.map((x) => x.id)).toEqual(["1", "2"]);
    expect(s.notComing.map((x) => x.id)).toEqual(["3"]);
  });

  it("lists the newest answers first", () => {
    const s = summarize([r("old", "ა", "ბ", 1, "2027-05-01T10:00:00Z"), r("new", "გ", "დ", 1, "2027-05-02T10:00:00Z")]);
    expect(s.coming.map((x) => x.id)).toEqual(["new", "old"]);
  });

  it("flags answers with the same name, ignoring case and extra spaces", () => {
    const s = summarize([r("1", "Nino", "Beridze", 2), r("2", "nino ", " beridze", null), r("3", "ნინო", "ბერიძე", 1)]);
    expect([...s.possibleDuplicates].sort()).toEqual(["1", "2"]);
  });

  it("is empty for no answers", () => {
    expect(summarize([])).toMatchObject({ people: 0, replies: 0, coming: [], notComing: [] });
  });
});
