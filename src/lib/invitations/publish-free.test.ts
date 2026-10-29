import { describe, expect, it, vi } from "vitest";
import { copy } from "@content/copy.ka";
import { publishFree, type PublishFreeDeps } from "./publish-free";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const complete = JSON.parse(JSON.stringify(copy.samples.birthday));

function deps(overrides: Partial<PublishFreeDeps> = {}): PublishFreeDeps {
  return {
    userId: "user-1",
    hasUnlimitedAccess: vi.fn(async () => true),
    findOwnInvitation: vi.fn(async (id: string) => ({ id, status: "draft", content: complete })),
    publish: vi.fn(async () => true),
    ...overrides,
  };
}

describe("publishFree", () => {
  it("publishes a complete draft for a host with unlimited access", async () => {
    const d = deps();
    expect(await publishFree(ID, d)).toEqual({ ok: true });
    expect(d.publish).toHaveBeenCalledWith(ID);
  });

  it("never publishes for a host without unlimited access, and checks that first", async () => {
    const d = deps({ hasUnlimitedAccess: vi.fn(async () => false) });
    expect(await publishFree(ID, d)).toEqual({ ok: false, error: "not_allowed" });
    expect(d.findOwnInvitation).not.toHaveBeenCalled();
    expect(d.publish).not.toHaveBeenCalled();
  });

  it.each([
    ["someone else's invitation", { findOwnInvitation: vi.fn(async () => null) }, "not_found"],
    ["an invitation already published", { findOwnInvitation: vi.fn(async (id: string) => ({ id, status: "published", content: complete })) }, "already_published"],
    ["an incomplete draft", { findOwnInvitation: vi.fn(async (id: string) => ({ id, status: "draft", content: { title: "ანას 30" } })) }, "incomplete"],
  ] as const)("refuses %s", async (_label, overrides, error) => {
    const d = deps(overrides as Partial<PublishFreeDeps>);
    expect(await publishFree(ID, d)).toEqual({ ok: false, error });
    expect(d.publish).not.toHaveBeenCalled();
  });

  it("rejects an id that isn't a uuid without looking anything up", async () => {
    const d = deps();
    expect(await publishFree("../x", d)).toEqual({ ok: false, error: "not_found" });
    expect(d.hasUnlimitedAccess).not.toHaveBeenCalled();
  });
});
