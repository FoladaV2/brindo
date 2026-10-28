import { expect, test } from "@playwright/test";

// The couple's guest overview with sample answers (/preview/guests: no database needed).
// The real page (/dashboard/invitations/[id]/guests) renders the same component from data read
// through RLS; supabase/tests/guest-overview.test.ts covers that read.

const OUT = "test-results/guests";

for (const width of [390, 1440]) {
  test(`overview: screenshots and no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.goto("/preview/guests");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/overview-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
}

test("summary counts guests by answer and adds up the confirmed headcount", async ({ page }) => {
  await page.goto("/preview/guests");
  expect(await page.locator(".overview-value").allTextContents()).toEqual(["10", "5", "2", "3"]);
  await expect(page.locator(".overview-headcount")).toHaveText("სულ 13 ადამიანი");
});

test("filters show only guests with that answer, and the list has no controls to edit an answer", async ({ page }) => {
  await page.goto("/preview/guests");
  await expect(page.locator(".overview-row")).toHaveCount(10);
  await page.getByRole("button", { name: /^ვერ მოდის/ }).click();
  await expect(page.getByRole("button", { name: /^ვერ მოდის/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".overview-row")).toHaveCount(2);
  await page.getByRole("button", { name: /^მოლოდინში/ }).click();
  await expect(page.locator(".overview-row")).toHaveCount(3);
  await expect(page.locator(".overview-list").locator("input, select, textarea, button")).toHaveCount(0);
});

test("reminder copies the editable message with the guest's personal link", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/preview/guests");
  await page.getByRole("button", { name: "შეხსენება" }).click();
  const message = page.getByLabel("შეხსენების ტექსტი");
  await expect(message).toHaveValue(/პასუხის ვადაა 15 მაისი 2027/);
  await message.fill("გამარჯობა! გთხოვთ, გვიპასუხოთ:");
  await page.getByRole("button", { name: /კოპირება.*ლევან ჯანელიძე/ }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.replace(/\r\n/g, "\n")).toBe("გამარჯობა! გთხოვთ, გვიპასუხოთ:\nhttps://brindo.ge/i/preview?g=sample-token-03-xxxxxxxxxxxxxxxxxxxxxxxx");
  await expect(page.getByRole("button", { name: /დაკოპირდა.*ლევან ჯანელიძე/ })).toBeVisible();
  await page.locator(".overview-remind").screenshot({ path: `${OUT}/reminder.png` });
});
