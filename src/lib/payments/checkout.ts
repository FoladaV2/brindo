import "server-only";
import { z } from "zod";
import { checkComplete } from "@/lib/invitations/schema";
import { parseRefCode } from "@/lib/referral";
import type { PaymentProvider } from "./provider";

export type CheckoutDeps = {
  provider: PaymentProvider;
  productId: string;
  /** From server config. Nothing the client sends can change it. */
  price: { amount: number; currency: string };
  siteUrl: string;
  /** The invitation as the signed-in couple sees it through RLS; null if it isn't theirs. */
  findOwnInvitation(id: string): Promise<{ id: string; status: string; content: unknown } | null>;
  createOrder(order: { invitationId: string; amount: number; currency: string; refCode: string | null }): Promise<string>;
  markOrderFailed(orderId: string): Promise<void>;
};

export type CheckoutInput = { invitationId: string; customerEmail?: string; refCode?: string | null };

export type CheckoutError = "not_found" | "already_published" | "incomplete" | "failed";
export type CheckoutResult = { ok: true; url: string } | { ok: false; error: CheckoutError };

const uuid = z.uuid();

/**
 * Pay and publish, step one: a pending order at the configured price, then a hosted checkout that
 * carries the order and invitation ids. Publishing happens only in the webhook.
 */
export async function startCheckout(input: CheckoutInput, deps: CheckoutDeps): Promise<CheckoutResult> {
  if (!uuid.safeParse(input.invitationId).success) return { ok: false, error: "not_found" };
  const invitation = await deps.findOwnInvitation(input.invitationId);
  if (!invitation) return { ok: false, error: "not_found" };
  if (invitation.status !== "draft") return { ok: false, error: "already_published" };
  if (!checkComplete(invitation.content).success) return { ok: false, error: "incomplete" };

  const orderId = await deps.createOrder({
    invitationId: invitation.id,
    amount: deps.price.amount,
    currency: deps.price.currency,
    refCode: parseRefCode(input.refCode),
  });

  const site = deps.siteUrl.replace(/\/$/, "");
  try {
    const session = await deps.provider.createCheckout({
      orderId,
      invitationId: invitation.id,
      productId: deps.productId,
      returnUrl: `${site}/dashboard/invitations/${invitation.id}/done`,
      cancelUrl: `${site}/dashboard/invitations/${invitation.id}/edit`,
      customerEmail: input.customerEmail,
    });
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[payments] checkout could not be created", { orderId, error });
    await deps.markOrderFailed(orderId).catch(() => {});
    return { ok: false, error: "failed" };
  }
}
