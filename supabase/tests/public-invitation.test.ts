import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPublishedInvitationBySlug } from "@/lib/invitations/public";
import { admin, createCouple, deleteCouple, must, uniqueSlug, type Couple } from "./helpers";

let couple: Couple;
const slugs = { draft: uniqueSlug("draft"), paid: uniqueSlug("paid"), published: uniqueSlug("pub") };
const content = { names: ["ალექსანდრე", "ელისაბედ"], message: "გელოდებით" };

beforeAll(async () => {
  couple = await createCouple("public");
  const paidAt = new Date().toISOString();
  must(
    await admin()
      .from("invitations")
      .insert([
        { owner_id: couple.id, slug: slugs.draft, template_id: "lumiere", content },
        { owner_id: couple.id, slug: slugs.paid, template_id: "lumiere", content, status: "paid", paid_at: paidAt },
        { owner_id: couple.id, slug: slugs.published, template_id: "noir", content, status: "published", paid_at: paidAt },
      ])
      .select(),
  );
});

afterAll(() => deleteCouple(couple));

describe("getPublishedInvitationBySlug", () => {
  it("returns a published invitation with only the fields needed to render it", async () => {
    expect(await getPublishedInvitationBySlug(slugs.published)).toEqual({
      slug: slugs.published,
      templateId: "noir",
      content,
      updatedAt: expect.any(String),
    });
  });

  it.each(["draft", "paid"] as const)("returns null for a %s invitation", async (state) => {
    expect(await getPublishedInvitationBySlug(slugs[state])).toBeNull();
  });

  it.each(["no-such-invitation", "", "../etc/passwd", "a".repeat(200), "Upper"])(
    "returns null for the slug %j",
    async (slug) => {
      expect(await getPublishedInvitationBySlug(slug)).toBeNull();
    },
  );
});
