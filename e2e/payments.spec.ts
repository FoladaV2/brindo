import { createHmac, randomBytes } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { copy } from "../content/copy.ka";
import { NO_SUPABASE, SEED, signIn, supabase } from "./supabase";

// Pay and publish against the running server and a seeded database. Dodo itself is not called for
// real: the server runs with test settings (below), the checkout call fails on a dummy API key, and
// webhooks are signed here with the same secret the server was given.
//
//   DODO_PAYMENTS_API_KEY=e2e-invalid DODO_PAYMENTS_WEBHOOK_KEY=whsec_<base64> DODO_PRODUCT_ID=pdt_e2e \
//   PRICE_AMOUNT_MINOR=4900 npm run start -- -p 3100        (then npm run test:e2e -- payments)

const OUT = "test-results/payments";
const NINO_ID = "a0000000-0000-4000-8000-00000000000a";
const WEBHOOK_KEY = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
const t = copy.payment.done;

const admin = () => createClient(supabase!.url, supabase!.serviceKey, { auth: { persistSession: false } });

async function completeDraft() {
  const slug = `e2e-pay-${randomBytes(4).toString("hex")}`;
  const { data, error } = await admin()
    .from("invitations")
    .insert({ owner_id: NINO_ID, slug, template_id: "lumiere", content: copy.samples.short })
    .select("id, slug")
    .single();
  if (error) throw error;
  return data as { id: string; slug: string };
}

async function addOrder(invitationId: string, status: "pending" | "failed") {
  const { data, error } = await admin()
    .from("orders")
    .insert({ invitation_id: invitationId, amount: 4900, currency: "GEL", status })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

function signedWebhook(body: string, id = `msg_${randomBytes(6).toString("hex")}`, key = WEBHOOK_KEY!) {
  const at = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", Buffer.from(key.replace(/^whsec_/, ""), "base64"))
    .update(`${id}.${at}.${body}`)
    .digest("base64");
  return { data: body, headers: { "webhook-id": id, "webhook-timestamp": String(at), "webhook-signature": `v1,${signature}` } };
}

async function shoot(page: Page, name: string) {
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${OUT}/${name}-${width}.png` });
  }
}

test.describe("pay and publish", () => {
  test.skip(!supabase, NO_SUPABASE);
  test.skip(!WEBHOOK_KEY, "Start the server with the payment test settings at the top of this file.");

  test("Pay and publish creates a pending order at the server's price and shows the hand-off", async ({ page }) => {
    const invitation = await completeDraft();
    await signIn(page, SEED.nino.email);
    // The referral code from an earlier visit ends up on the order.
    await page.goto("/dashboard?ref=E2E_REF");
    await page.goto(`/dashboard/invitations/${invitation.id}/edit`);

    const pay = page.getByRole("button", { name: copy.editor.pay });
    await expect(pay).toBeEnabled();
    await expect(page.getByText("49 ლარი")).toBeVisible();
    await shoot(page, "editor-pay");

    // Hold the server action for a moment so the hand-off screen can be seen and photographed.
    await page.route(`**/dashboard/invitations/${invitation.id}/edit`, async (route) => {
      if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, 6000));
      await route.continue();
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await pay.click();
    await expect(page.getByText(copy.payment.redirecting.heading)).toBeVisible();
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${OUT}/redirecting-390.png` });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${OUT}/redirecting-1440.png` });

    // The dummy API key makes Dodo refuse: the couple sees a calm error and can try again.
    await expect(page.getByRole("alert")).toHaveText(copy.payment.errors.failed, { timeout: 30_000 });
    await shoot(page, "editor-pay-error");

    const { data: orders } = await admin().from("orders").select("amount, currency, status, ref_code").eq("invitation_id", invitation.id);
    expect(orders).toEqual([{ amount: 4900, currency: "GEL", status: "failed", ref_code: "E2E_REF" }]);
  });

  test("/done waits for the webhook, then shows the published invitation", async ({ page, request }) => {
    const invitation = await completeDraft();
    const orderId = await addOrder(invitation.id, "pending");
    expect((await request.get(`/i/${invitation.slug}`)).status()).toBe(404); // not published yet (and now cached as such)

    await signIn(page, SEED.nino.email);
    await page.goto(`/dashboard/invitations/${invitation.id}/done?payment_id=pay_fake&status=succeeded`);
    await expect(page.getByRole("heading", { name: t.confirming.heading })).toBeVisible();
    await page.waitForTimeout(1200);
    await shoot(page, "done-confirming");

    // An unsigned webhook is refused and changes nothing.
    const payload = JSON.stringify({
      business_id: "bus_e2e",
      type: "payment.succeeded",
      timestamp: new Date().toISOString(),
      data: {
        payload_type: "Payment",
        payment_id: `pay_${randomBytes(6).toString("hex")}`,
        total_amount: 4900,
        tax: 0,
        currency: "GEL",
        metadata: { order_id: orderId, invitation_id: invitation.id },
      },
    });
    const forged = signedWebhook(payload, "msg_forged", "whsec_c29tZW9uZS1lbHNlcy1zZWNyZXQtMTIzNDU2");
    expect((await request.post("/api/webhooks/dodo", forged)).status()).toBe(401);

    const genuine = signedWebhook(payload);
    expect((await request.post("/api/webhooks/dodo", genuine)).status()).toBe(200);

    await expect(page.getByRole("heading", { name: t.published.heading })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(`/i/${invitation.slug}`)).toBeVisible();
    await page.waitForTimeout(2600); // entrance and the single light sweep
    await shoot(page, "done-published");

    // Guests can open it immediately: the cached 404 was replaced.
    expect((await request.get(`/i/${invitation.slug}`)).status()).toBe(200);

    // The same delivery again is acknowledged and changes nothing.
    const before = await admin().from("invitations").select("status, paid_at, updated_at").eq("id", invitation.id).single();
    expect((await request.post("/api/webhooks/dodo", genuine)).status()).toBe(200);
    const after = await admin().from("invitations").select("status, paid_at, updated_at").eq("id", invitation.id).single();
    expect(after.data).toEqual(before.data);
    const { data: events } = await admin().from("webhook_events").select("outcome").eq("event_id", genuine.headers["webhook-id"]);
    expect(events).toEqual([{ outcome: "published" }]);
  });

  test("/done after a failed payment, and when confirmation is slow", async ({ page }) => {
    const failed = await completeDraft();
    await addOrder(failed.id, "failed");
    await signIn(page, SEED.nino.email);
    await page.goto(`/dashboard/invitations/${failed.id}/done?status=succeeded`);
    await expect(page.getByRole("heading", { name: t.failed.heading })).toBeVisible();
    await page.waitForTimeout(1200);
    await shoot(page, "done-failed");

    const slow = await completeDraft();
    await addOrder(slow.id, "pending");
    await page.clock.install();
    await page.goto(`/dashboard/invitations/${slow.id}/done`);
    await expect(page.getByRole("heading", { name: t.confirming.heading })).toBeVisible();
    await page.clock.runFor(45_000);
    await expect(page.getByRole("heading", { name: t.slow.heading })).toBeVisible();
    await page.clock.runFor(1500);
    await shoot(page, "done-slow");
  });
});

test.describe("referral capture", () => {
  test("?ref keeps a valid code for 60 days and ignores a malformed one", async ({ page, context }) => {
    await page.goto("/login?ref=SALON_7");
    const cookie = (await context.cookies()).find((c) => c.name === "brindo_ref");
    expect(cookie?.value).toBe("SALON_7");
    expect(cookie?.httpOnly).toBe(true);
    const days = (cookie!.expires - Date.now() / 1000) / 86_400;
    expect(days).toBeGreaterThan(59.9);
    expect(days).toBeLessThanOrEqual(60);

    await page.goto("/styleguide?ref=not%20valid!");
    expect((await context.cookies()).find((c) => c.name === "brindo_ref")?.value).toBe("SALON_7");
  });
});
