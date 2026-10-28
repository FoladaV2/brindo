import { revalidateTag } from "next/cache";
import { invitationTag } from "@/lib/invitations/access";
import { paymentProvider } from "@/lib/payments";
import type { PaymentProvider } from "@/lib/payments/provider";
import { applyPaymentEvent } from "@/lib/payments/store";
import { handlePaymentWebhook } from "@/lib/payments/webhook";

/** Dodo's webhook endpoint. All the rules live in handlePaymentWebhook and apply_payment_event. */
export async function POST(request: Request) {
  let provider: PaymentProvider;
  try {
    provider = paymentProvider();
  } catch (error) {
    console.error("[payments] webhook received but payments are not configured", error);
    return new Response("Not configured", { status: 500 });
  }

  return handlePaymentWebhook(request, {
    provider,
    apply: applyPaymentEvent,
    // Guests who open the link right after paying must see the invitation, not a cached 404.
    onPublished: (slug) => revalidateTag(invitationTag(slug), { expire: 0 }),
  });
}
