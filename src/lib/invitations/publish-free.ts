import { z } from "zod";
import { checkComplete } from "./schema";

/** Publishing without paying, for hosts with unlimited access (granted in /admin). */

export type PublishFreeDeps = {
  /** The signed-in host's id, from the verified session. */
  userId: string;
  hasUnlimitedAccess(userId: string): Promise<boolean>;
  /** The invitation as this host sees it through RLS; null if it isn't theirs. */
  findOwnInvitation(id: string): Promise<{ id: string; status: string; content: unknown } | null>;
  /** Marks a draft published (only if it is still a draft). Returns false if nothing changed. */
  publish(id: string): Promise<boolean>;
};

export type PublishFreeError = "not_allowed" | "not_found" | "already_published" | "incomplete" | "failed";
export type PublishFreeResult = { ok: true } | { ok: false; error: PublishFreeError };

const uuid = z.uuid();

/** Entitlement first, then ownership, state and completeness: the same checks a paid publish makes. */
export async function publishFree(invitationId: string, deps: PublishFreeDeps): Promise<PublishFreeResult> {
  if (!uuid.safeParse(invitationId).success) return { ok: false, error: "not_found" };
  if (!(await deps.hasUnlimitedAccess(deps.userId))) return { ok: false, error: "not_allowed" };
  const invitation = await deps.findOwnInvitation(invitationId);
  if (!invitation) return { ok: false, error: "not_found" };
  if (invitation.status !== "draft") return { ok: false, error: "already_published" };
  if (!checkComplete(invitation.content).success) return { ok: false, error: "incomplete" };
  return (await deps.publish(invitation.id)) ? { ok: true } : { ok: false, error: "failed" };
}
