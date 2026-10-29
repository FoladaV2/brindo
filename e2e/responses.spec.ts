import { expect, test, type Page } from "@playwright/test";
import { motionAudit } from "./audits";

// The host's answers page with sample answers (/preview/responses: no database needed).
// The real page (/dashboard/invitations/[id]/responses) renders the same component from answers
// read through RLS; supabase/tests/rls.test.ts covers that read and the delete.

const OUT = "test-results/responses";

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto("/preview/responses");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

for (const width of [390, 1440]) {
  test(`responses: screenshots and no horizontal scroll at ${width}px`, async ({ page }) => {
    await open(page, width);
    await page.screenshot({ path: `${OUT}/responses-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
}

test("the total adds up every party coming; the lists split coming and not coming", async ({ page }) => {
  await open(page, 1440);
  // Sample: 4 + 2 + 3 + 1 + 5 + 2 + 2 + 2 people in 8 answers, and 2 not coming.
  await expect(page.getByLabel("სულ მოდის")).toContainText("21");
  await expect(page.getByRole("tab", { name: /მოდის 8/ })).toBeVisible();
  await page.getByRole("tab", { name: /არ მოდის/ }).click();
  await expect(page.getByText("ლევან ჯანელიძე არ მოდის")).toBeVisible();
});

test("answers with the same name are flagged, not merged", async ({ page }) => {
  await open(page, 1440);
  await expect(page.getByText("შესაძლოა გამეორებაა")).toHaveCount(2);
});

test("deleting an answer asks first, then updates the total", async ({ page }) => {
  await open(page, 390);
  await page.getByRole("button", { name: "ნინო ბერიძე-ჩიქოვანი: წაშლა" }).first().click();
  await page.getByRole("menuitem", { name: "წაშლა" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("ნინო ბერიძე-ჩიქოვანი");
  await page.screenshot({ path: `${OUT}/delete-dialog-390.png` });
  await dialog.getByRole("button", { name: "წაშლა" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByLabel("სულ მოდის")).toContainText("17");
  await expect(page.getByText("შესაძლოა გამეორებაა")).toHaveCount(0);
});

test("responses animate only transform and opacity", async ({ page }) => {
  await open(page, 1440);
  expect(await motionAudit(page)).toEqual([]);
});
