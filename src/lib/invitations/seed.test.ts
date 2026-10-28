import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { invitationContentSchema, invitationDraftSchema } from "./schema";

// Same rule as the invitations_slug_format constraint (public.ts is server-only, so not imported here).
const SLUG_FORMAT = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;

// The local seed must stay renderable: drafts pass the draft rules, published content the full rules.
const sql = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8");
const rows = [...sql.matchAll(/'([a-z0-9-]+)', 'lumiere',\s*'(\{[^']*\})', '(draft|paid|published)'/g)].map((m) => ({
  slug: m[1],
  content: JSON.parse(m[2]),
  status: m[3],
}));

describe("supabase/seed.sql invitations", () => {
  it("has a draft and a published invitation", () => {
    expect(rows.map((r) => r.status).sort()).toEqual(["draft", "published"]);
  });

  it.each(rows)("$slug fits the schema for its status", ({ slug, content, status }) => {
    expect(slug).toMatch(SLUG_FORMAT);
    expect(invitationDraftSchema.safeParse(content).success).toBe(true);
    if (status === "published") expect(invitationContentSchema.safeParse(content).success).toBe(true);
  });
});
