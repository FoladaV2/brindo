import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, anon, createCouple, deleteCouple, must, PERMISSION_DENIED, type Couple } from "./helpers";

// /admin's data is server-only: page views, unlimited access and the aggregates are reachable only
// with the service role, never with the anon key or a host's session (admins included: the admin
// page checks ADMIN_EMAILS in server code and then reads with the service role).

const FUNCTIONS = [
  ["admin_traffic", { p_since: new Date(0).toISOString() }],
  ["admin_breakdown", { p_since: new Date(0).toISOString(), p_dimension: "path" }],
  ["admin_visitors_on", { p_since: new Date(0).toISOString(), p_paths: null }],
  ["admin_funnel", { p_since: new Date(0).toISOString() }],
  ["admin_totals", { p_since: new Date(0).toISOString() }],
  ["admin_onboarding_answers", { p_since: new Date(0).toISOString() }],
  ["admin_entitlements", {}],
  ["admin_user_id_by_email", { p_email: "nobody@example.com" }],
] as const;

let host: Couple;

beforeAll(async () => {
  host = await createCouple("admin-host");
  must(await admin().from("entitlements").insert({ user_id: host.id, note: "test" }).select().single());
  must(
    await admin()
      .from("page_views")
      .insert({ visitor: "a".repeat(64), path: "/", device: "mobile" })
      .select()
      .single(),
  );
});

afterAll(async () => {
  await admin().from("page_views").delete().eq("visitor", "a".repeat(64));
  await deleteCouple(host);
});

describe("admin tables", () => {
  it.each(["page_views", "entitlements"] as const)("%s: closed to anonymous visitors and to hosts", async (table) => {
    for (const client of [anon(), host.client]) {
      const read = await client.from(table).select("*");
      const write = await client.from(table).insert({} as never);
      expect(read.error?.code).toBe(PERMISSION_DENIED);
      expect(write.error?.code).toBe(PERMISSION_DENIED);
    }
  });

  it("a host cannot mark their own invitation as published for free", async () => {
    const invitation = must(await host.client.from("invitations").insert({ slug: `adm-${Date.now()}`, template_id: "lumiere" }).select().single());
    const { error } = await host.client.from("invitations").update({ published_free: true } as never).eq("id", invitation.id);
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it("page views keep only what was designed: a hashed visitor, a clean path, a device", async () => {
    const bad = await admin().from("page_views").insert({ visitor: "198.51.100.7", path: "/i/<x>", device: "fridge" });
    expect(bad.error).not.toBeNull();
  });
});

describe("admin functions", () => {
  it.each(FUNCTIONS)("%s runs only for the service role", async (name, args) => {
    for (const client of [anon(), host.client]) {
      const { error } = await client.rpc(name as never, args as never);
      expect(error?.code, name).toBe(PERMISSION_DENIED);
    }
    const { error } = await admin().rpc(name as never, args as never);
    expect(error, name).toBeNull();
  });

  it("finds an account by email, case-insensitively, and lists its unlimited access", async () => {
    const { data: id } = await admin().rpc("admin_user_id_by_email", { p_email: host.email.toUpperCase() });
    expect(id).toBe(host.id);
    const { data: list } = await admin().rpc("admin_entitlements", {});
    expect(list?.some((e) => e.user_id === host.id && e.email === host.email)).toBe(true);
  });
});
