import { expect, test, type Page } from "@playwright/test";
import { expectBrandFontsOnly, motionAudit } from "./audits";

// The brand styleguide (three colours, shadcn/ui components restyled to DESIGN.md).

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto("/styleguide");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("load");
  await page.waitForTimeout(600);
}

for (const width of [390, 1440]) {
  test(`brand screenshots at ${width}px`, async ({ page }) => {
    await open(page, width);
    await page.addStyleTag({ content: "header { position: static !important; }" });
    await page.screenshot({ path: `test-results/styleguide/brand-${width}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
  });
}

test("brand overlays: dialog, menu, select open cleanly", async ({ page }) => {
  await open(page, 390);
  await page.getByRole("combobox").click();
  await page.screenshot({ path: "test-results/styleguide/brand-select-390.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /ფანჯრის გახსნა/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/styleguide/brand-dialog-390.png" });
});

test("brand styleguide renders only in the brand fonts", async ({ page }) => {
  await open(page, 1440);
  await expectBrandFontsOnly(page);
});

test("brand styleguide animates only transform and opacity", async ({ page }) => {
  await open(page, 1440);
  expect(await motionAudit(page)).toEqual([]);

  await page.getByRole("button", { name: /შექმენით მოსაწვევი/ }).first().hover();
  await page.getByLabel(/^სახელი$/).focus();
  await page.getByRole("radio", { name: /80 – 150/ }).click();
  await page.getByRole("button", { name: /შემიძლია მოსაწვევის შეცვლა/ }).click();
  expect(await motionAudit(page)).toEqual([]);
});

test("brand styleguide is noindex", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
