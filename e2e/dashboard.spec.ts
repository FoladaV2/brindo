import { expect, test, type Page } from "@playwright/test";
import { expectBrandFontsOnly, motionAudit } from "./audits";

// The host's area with sample events (/preview/dashboard: no database needed). The real list reads
// the host's invitations through RLS; supabase/tests/rls.test.ts covers that.

const OUT = "test-results/dashboard";

async function open(page: Page, path: string, width: number) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("load");
  await page.waitForTimeout(600);
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const width of [390, 1440]) {
  test(`events list and first-time state at ${width}px`, async ({ page }) => {
    await open(page, "/preview/dashboard", width);
    await page.screenshot({ path: `${OUT}/events-${width}.png`, fullPage: true });
    expect(await overflow(page)).toBeLessThanOrEqual(0);

    await open(page, "/preview/dashboard?empty", width);
    await page.screenshot({ path: `${OUT}/empty-${width}.png` });
    await expect(page.getByRole("link", { name: "მოსაწვევის შექმნა" })).toHaveAttribute("href", "/dashboard/invitations/new");
  });

  test(`responses in the shell at ${width}px`, async ({ page }) => {
    await open(page, "/preview/responses", width);
    await page.screenshot({ path: `${OUT}/responses-${width}.png`, fullPage: true });
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
}

test("phones get a bottom bar with a raised create button; desktop gets the sidebar", async ({ page }) => {
  await open(page, "/preview/dashboard", 390);
  const bottom = page.getByRole("navigation", { name: "კაბინეტის ნავიგაცია" }).last();
  await expect(bottom).toBeVisible();
  await expect(bottom.getByRole("link", { name: "ახალი მოსაწვევი" })).toHaveAttribute("href", "/dashboard/invitations/new");
  await expect(bottom.getByRole("link", { name: "ანგარიში" })).toBeVisible();

  await open(page, "/preview/dashboard", 1440);
  await expect(page.getByRole("complementary")).toBeVisible();
  await expect(page.getByRole("complementary").getByRole("link", { name: "ახალი მოსაწვევი" })).toBeVisible();
  await expect(page.getByRole("button", { name: "გასვლა" })).toBeVisible();
});

test("a live event leads to its answers and its link; a draft leads back to the editor", async ({ page }) => {
  await open(page, "/preview/dashboard", 1440);
  const live = page.getByRole("article").filter({ hasText: "ანას 30" });
  await expect(live).toContainText("21");
  await expect(live.getByRole("link", { name: "პასუხები" })).toHaveAttribute("href", "/dashboard/invitations/sample-1/responses");
  await expect(live.getByRole("button", { name: "ბმულის კოპირება" })).toBeVisible();
  const draft = page.getByRole("article").filter({ hasText: "ია & ლუკა" });
  await expect(draft.getByRole("link", { name: /გაგრძელება/ })).toHaveAttribute("href", "/dashboard/invitations/sample-3/edit");
});

test("the dashboard renders only in the brand fonts and animates only transform and opacity", async ({ page }) => {
  await open(page, "/preview/dashboard", 1440);
  await expectBrandFontsOnly(page, 10, 20);
  expect(await motionAudit(page)).toEqual([]);
});

test("the 404 page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // A malformed slug is rejected before any lookup, the same 404 as an unknown one.
  const res = await page.goto("/i/Not_A_Slug");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "გვერდი ვერ მოიძებნა" })).toBeVisible();
  await page.screenshot({ path: `${OUT}/not-found-390.png` });
});
