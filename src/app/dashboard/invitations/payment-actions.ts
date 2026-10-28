"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { copy } from "@content/copy.ka";
import { paymentProvider, paymentSettings } from "@/lib/payments";
import { startCheckout, type CheckoutResult } from "@/lib/payments/checkout";
import { createOrder, markOrderFailed } from "@/lib/payments/store";
import { REF_COOKIE } from "@/lib/referral";
import { createClient } from "@/lib/supabase/server";

export type PayState = { error?: string };

/**
 * Pay and publish: creates a pending order and sends the couple to the hosted checkout. The only
 * input is the invitation id, and RLS decides whether it is theirs; the price is server config.
 */
export async function payAndPublish(invitationId: string): Promise<PayState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (!claims?.sub) redirect("/login");

  let result: CheckoutResult;
  try {
    const settings = paymentSettings();
    result = await startCheckout(
      {
        invitationId,
        customerEmail: typeof claims.email === "string" ? claims.email : undefined,
        refCode: (await cookies()).get(REF_COOKIE)?.value,
      },
      {
        provider: paymentProvider(),
        productId: settings.productId,
        price: settings.price,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        findOwnInvitation: async (id) => {
          const { data, error } = await supabase.from("invitations").select("id, status, content").eq("id", id).maybeSingle();
          if (error) throw error;
          return data;
        },
        createOrder,
        markOrderFailed,
      },
    );
  } catch (error) {
    console.error("[payments] pay and publish failed", error);
    result = { ok: false, error: "failed" };
  }

  if (!result.ok) return { error: copy.payment.errors[result.error] };
  redirect(result.url);
}
