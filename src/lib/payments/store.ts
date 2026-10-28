import "server-only";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import type { PaymentEvent } from "./provider";
import type { ApplyResult } from "./webhook";

// Orders and webhook events are written only here, with the service role: couples have no grants on
// either table. Callers must already have checked ownership (checkout) or the signature (webhook).

export async function createOrder(order: { invitationId: string; amount: number; currency: string; refCode: string | null }) {
  const { data, error } = await createServiceClient()
    .from("orders")
    .insert({
      invitation_id: order.invitationId,
      provider: "dodo",
      amount: order.amount,
      currency: order.currency,
      ref_code: order.refCode,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function markOrderFailed(orderId: string) {
  const { error } = await createServiceClient().from("orders").update({ status: "failed" }).eq("id", orderId).eq("status", "pending");
  if (error) throw error;
}

export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

/** The newest order for an invitation. Call only after confirming the couple owns it. */
export async function latestOrderStatus(invitationId: string): Promise<OrderStatus | null> {
  const { data, error } = await createServiceClient()
    .from("orders")
    .select("status")
    .eq("invitation_id", invitationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.status as OrderStatus | undefined) ?? null;
}

const applyResult = z.object({
  outcome: z.string(),
  order_id: z.string().nullish(),
  invitation_id: z.string().nullish(),
  slug: z.string().nullish(),
});

/** One transaction in the database: record the event id (or stop if seen), then apply it. */
export async function applyPaymentEvent(event: PaymentEvent): Promise<ApplyResult> {
  const args = {
    p_event_id: event.id,
    p_event_type: event.type,
    p_kind: event.kind,
    p_order_id: null as string | null,
    p_invitation_id: null as string | null,
    p_payment_id: event.paymentId,
    p_amount: null as number | null,
    p_tax: null as number | null,
    p_currency: null as string | null,
    p_partial: null as boolean | null,
  };
  if (event.kind === "payment_succeeded") {
    Object.assign(args, {
      p_order_id: event.orderId,
      p_invitation_id: event.invitationId,
      p_amount: event.amount,
      p_tax: event.tax,
      p_currency: event.currency,
    });
  } else if (event.kind === "payment_failed") {
    Object.assign(args, { p_order_id: event.orderId, p_invitation_id: event.invitationId });
  } else if (event.kind === "refund_succeeded") {
    args.p_partial = event.partial;
  }

  const { data, error } = await createServiceClient().rpc("apply_payment_event", args);
  if (error) throw error;
  const result = applyResult.parse(data);
  return { outcome: result.outcome, orderId: result.order_id, invitationId: result.invitation_id, slug: result.slug };
}
