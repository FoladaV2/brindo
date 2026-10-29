import { expect, test, type Page } from "@playwright/test";
import { NO_SUPABASE, SEED, signIn, supabase } from "./supabase";

const OUT = "test-results/editor";

/** Fails the test on any console error or uncaught exception. */
function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

// ---------- No database needed ----------

test("robots.txt keeps crawlers out of invitations but lets link previews in", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toMatch(/User-Agent: \*\s*\nDisallow: \/i\//);
  expect(body).toMatch(/User-Agent: facebookexternalhit[\s\S]*?Allow: \/i\//);
});

test("an invalid invitation link answers 404, not 200", async ({ request }) => {
  const res = await request.get("/i/NOT_A_SLUG");
  expect(res.status()).toBe(404);
});

test("the sample link-preview image is a 1200×630 PNG", async ({ request }) => {
  const res = await request.get("/preview/og/full");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
});

// ---------- With Supabase (seeded: `supabase db reset`) ----------

test.describe("with a database", () => {
  test.skip(!supabase, NO_SUPABASE);

  test("a host creates and edits an invitation, sees the live preview, and opens the draft", async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchConsole(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page, SEED.nino.email);
    await page.screenshot({ path: `${OUT}/dashboard-1440.png`, fullPage: true });

    // Create: the event type and the names, then the editor.
    await page.goto("/dashboard/invitations/new");
    await page.getByRole("radio", { name: "ქორწილი" }).click();
    await page.getByLabel("პირველი სახელი").fill("ალექსანდრე ჯავახიშვილი");
    await page.getByLabel("მეორე სახელი").fill("ელისაბედ ციციშვილი");
    await page.getByRole("button", { name: "გაგრძელება" }).click();
    await page.waitForURL(/\/dashboard\/invitations\/[0-9a-f-]+\/edit$/);
    const editUrl = page.url();
    await expect(page.getByTestId("draft-page")).toHaveAttribute("href", /^\/i\/aleksandre-da-elisabed-[a-z2-9]{4}$/);

    const frame = page.frameLocator('iframe[title="მოსაწვევის გადახედვა"]');
    await expect(frame.locator("h1")).toContainText("ალექსანდრე");

    // Every field.
    await page.getByLabel("პირველი სახელი").fill("ნინო");
    await expect(frame.locator("h1")).toContainText("ნინო"); // live preview follows typing
    await page.getByLabel("თარიღი", { exact: true }).fill("2027-07-10");
    await page.getByLabel("დრო", { exact: true }).fill("17:30");
    await page.getByLabel("ადგილის სახელი").fill("ორბელიანების სასახლე");
    await page.getByLabel("მისამართი").fill("ილია ჭავჭავაძის გამზირი 37ა\nმეორე სართული");
    await page.getByLabel("ქალაქი").fill("თბილისი");
    await page.getByLabel("დრესკოდი").fill("საღამოს სამოსი");
    const message = "ძვირფასო მეგობრებო,\nგელოდებით ჩვენს დღესასწაულზე.";
    await page.getByLabel("ტექსტი").fill(message);
    await expect(page.getByText(`${message.length} / 400`)).toBeVisible();
    await page.getByRole("button", { name: "პუნქტის დამატება" }).click();
    await page.getByLabel("დრო", { exact: true }).nth(1).fill("19:00");
    await page.getByLabel("რა ხდება").fill("საზეიმო ვახშამი");
    await page.getByRole("button", { name: "პუნქტის დამატება" }).click();
    await page.getByRole("button", { name: "პუნქტის წაშლა 2" }).click();
    await page.getByLabel("ბოლო ვადა").fill("2027-06-15");

    // Photo: resized, uploaded with progress, then a focal point.
    await page.locator('input[type="file"]').setInputFiles("public/preview/lumiere-sample.jpg");
    const focus = page.getByRole("button", { name: /ფოკუსის წერტილი/ });
    await expect(focus).toBeEnabled({ timeout: 30_000 });
    const box = (await focus.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.7);
    await expect(focus).toHaveAccessibleName(/30%, 70%/);

    await expect(page.getByRole("status").filter({ hasText: "შენახულია" })).toBeVisible({ timeout: 10_000 });
    await expect(frame.locator("h2", { hasText: "ორბელიანების სასახლე" })).toBeVisible();
    await expect(frame.getByText("საზეიმო ვახშამი")).toBeVisible();
    await expect(frame.locator(".inv-photo img")).toHaveAttribute("style", /object-position:\s*30% 70%/);
    await page.screenshot({ path: `${OUT}/editor-1440.png` });

    // Reload: everything was saved.
    await page.reload();
    await expect(page.getByLabel("ქალაქი")).toHaveValue("თბილისი");
    await expect(page.getByLabel("რა ხდება")).toHaveValue("საზეიმო ვახშამი");

    // Mobile: the floating Preview button opens the preview full-screen.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${OUT}/editor-390.png` });
    await page.getByRole("button", { name: "გადახედვა" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({ path: `${OUT}/editor-preview-390.png` });
    await page.getByRole("button", { name: "დახურვა" }).click();

    // Draft preview: the owner sees the real page with the ribbon.
    const slug = (await page.getByTestId("draft-page").getAttribute("href"))!.split("/i/")[1];
    const res = await page.goto(`/i/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("status").filter({ hasText: "ჯერ არ არის გამოქვეყნებული" })).toBeVisible();
    await page.screenshot({ path: `${OUT}/draft-preview-390.png` });

    expect(errors).toEqual([]);
    expect(editUrl).toContain("/edit");
  });

  test("another host gets 404 for someone else's editor, preview frame and draft", async ({ page, browser }) => {
    await signIn(page, SEED.ana.email);
    for (const path of [
      `/dashboard/invitations/${SEED.nino.draftId}/edit`,
      `/dashboard/invitations/${SEED.nino.draftId}/frame`,
      `/i/${SEED.nino.draftSlug}`,
    ]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
      await expect(page.getByText("ნინო")).toHaveCount(0);
    }

    // Nobody signed in: the draft is just as absent.
    const guest = await browser.newPage();
    expect((await guest.goto(`/i/${SEED.nino.draftSlug}`))?.status()).toBe(404);
    await guest.close();
  });

  test("a published invitation has link-preview tags and an image in the display font", async ({ page, request }) => {
    const res = await page.goto(`/i/${SEED.ana.publishedSlug}`);
    expect(res?.status()).toBe(200);
    const meta = (property: string) => page.locator(`head meta[property="${property}"], head meta[name="${property}"]`).first();
    await expect(meta("og:title")).toHaveAttribute("content", "ანა & ლუკა: მოწვევა");
    await expect(meta("og:description")).toHaveAttribute("content", /2027 · თელავი$/);
    await expect(meta("twitter:card")).toHaveAttribute("content", "summary_large_image");
    await expect(meta("robots")).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("status").filter({ hasText: "ჯერ არ არის" })).toHaveCount(0);

    const image = await meta("og:image").getAttribute("content");
    expect(image).toMatch(/\/i\/ana-da-luka-m3pd\/og\?v=/);
    const png = await request.get(image!);
    expect(png.headers()["content-type"]).toBe("image/png");
    expect(png.headers()["cache-control"]).toContain("public");
  });
});
