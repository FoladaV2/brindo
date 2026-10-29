import { expect, test, type Page } from "@playwright/test";
import { expectBrandFontsOnly, motionAudit } from "./audits";

// The marketing home page. Built with STYLEGUIDE_ENABLED=true, so sample reviews show (labelled).

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

/** Scroll through the page so every reveal fires, then let the hero settle. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(2800);
}

for (const width of [390, 1440]) {
  test(`home screenshots at ${width}px`, async ({ page }) => {
    await open(page, width);
    await settle(page);
    await page.screenshot({ path: `test-results/home/home-${width}-fold.png` });
    await page.addStyleTag({ content: "header { position: absolute !important; }" });
    await page.screenshot({ path: `test-results/home/home-${width}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
  });
}

test("navbar becomes a floating pill after scrolling, and the phone menu opens", async ({ page }) => {
  await open(page, 390);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/home/home-390-scrolled.png" });
  await page.getByRole("button", { name: "მენიუ" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "test-results/home/home-390-menu.png" });
});

test("one h1, every section titled, primary actions lead to registration", async ({ page }) => {
  await open(page, 1440);
  await expect(page.locator("h1")).toHaveCount(1);
  for (const id of ["how", "features", "pricing", "faq"]) await expect(page.locator(`#${id}`)).toBeVisible();
  const ctas = page.getByRole("link", { name: /შექმენით მოსაწვევი/ });
  expect(await ctas.count()).toBeGreaterThanOrEqual(3);
  for (const href of await ctas.evaluateAll((els) => els.map((a) => a.getAttribute("href")))) expect(href).toBe("/register");
});

test("sample reviews are labelled as samples", async ({ page }) => {
  await open(page, 1440);
  await expect(page.getByText("ნიმუში").first()).toBeVisible();
});

test("home renders only in the brand fonts", async ({ page }) => {
  await open(page, 1440);
  await settle(page);
  await expectBrandFontsOnly(page);
});

test("home animates only transform and opacity", async ({ page }) => {
  await open(page, 1440);
  expect(await motionAudit(page)).toEqual([]);
  await page.getByRole("button", { name: /შემიძლია მოსაწვევის შეცვლა/ }).click();
  await page.getByRole("link", { name: /შექმენით მოსაწვევი/ }).first().hover();
  expect(await motionAudit(page)).toEqual([]);
});

test("reduced motion: the event strip stops and wraps, the hero is still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, 390);
  const state = await page.evaluate(() => ({
    marquee: getComputedStyle(document.querySelector(".marquee-track")!).animationName,
    rim: getComputedStyle(document.querySelector(".hero-rim-l")!).animationName,
  }));
  expect(state).toEqual({ marquee: "none", rim: "none" });
});

test("legal pages show the draft notice", async ({ page }) => {
  for (const path of ["/terms", "/privacy"]) {
    await page.goto(path);
    await expect(page.getByText("სამუშაო ვერსია")).toBeVisible();
  }
});
