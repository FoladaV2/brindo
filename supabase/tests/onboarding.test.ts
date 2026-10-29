import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, anon, createCouple, deleteCouple, must, PERMISSION_DENIED, type Couple } from "./helpers";

// Onboarding answers belong to the host who gave them: nobody else can read or change them.

let a: Couple;
let b: Couple;

beforeAll(async () => {
  a = await createCouple("onboarding-a");
  b = await createCouple("onboarding-b");
  must(await a.client.from("onboarding").insert({ answers: { eventType: "birthday" } }).select().single());
});

afterAll(async () => {
  await deleteCouple(a);
  await deleteCouple(b);
});

describe("onboarding RLS", () => {
  it("a host reads and updates only their own row", async () => {
    const own = must(await a.client.from("onboarding").select("user_id, answers").single());
    expect(own.user_id).toBe(a.id);

    const { error } = await a.client.from("onboarding").upsert({ answers: { eventType: "wedding" }, skipped: false }, { onConflict: "user_id" });
    expect(error).toBeNull();
  });

  it("another host sees nothing and changes nothing", async () => {
    const { data } = await b.client.from("onboarding").select("user_id").eq("user_id", a.id);
    expect(data).toEqual([]);

    await b.client.from("onboarding").update({ skipped: true }).eq("user_id", a.id);
    const row = must(await admin().from("onboarding").select("skipped").eq("user_id", a.id).single());
    expect(row.skipped).toBe(false);
  });

  it("a host cannot write a row for someone else", async () => {
    const { error } = await b.client.from("onboarding").insert({ user_id: a.id, answers: {} } as never);
    expect(error).not.toBeNull();
  });

  it("anonymous visitors have no access", async () => {
    const { error } = await anon().from("onboarding").select("user_id");
    expect(error?.code).toBe(PERMISSION_DENIED);
  });
});
