import { expect, test, type Page } from "@playwright/test";
import { expectBrandFontsOnly, motionAudit } from "./audits";

// The template kit's styleguide. The brand styleguide is tested in styleguide.spec.ts.

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto("/styleguide/templates");
  await page.evaluate(() => document.fonts.ready);
}

/** Scroll the whole page so every Reveal fires, then let motion settle. */
async function settle(page: Page) {
  await page.waitForFunction(() => window.__brindoHydrated === true);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(2600);
}

for (const width of [390, 1440]) {
  test(`screenshots at ${width}px`, async ({ page }) => {
    await open(page, width);
    await settle(page);
    await page.addStyleTag({ content: "nav { position: static !important; }" });
    for (const surface of ["light", "dark"]) {
      await page.getByTestId(`surface-${surface}`).screenshot({ path: `test-results/styleguide/templates-${surface}-${width}.png` });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
  });
}

test("every text node renders in the brand fonts, with no system fallback", async ({ page }) => {
  await open(page, 1440);
  await expectBrandFontsOnly(page);
});

test("display and body text use the intended families", async ({ page }) => {
  await open(page, 1440);
  const families = await page.evaluate(() => ({
    display: getComputedStyle(document.querySelector("h1")!).fontFamily,
    body: getComputedStyle(document.body).fontFamily,
  }));
  // next/font/local names the face after its export ("display") and adds a metric-matched fallback
  expect(families.display).toMatch(/^display, "display Fallback"/);
  expect(families.body).toMatch(/Noto_Sans_Georgian|Noto Sans Georgian/i);
});

test("nothing animates layout properties", async ({ page }) => {
  await open(page, 1440);
  const audit = () => motionAudit(page);

  expect(await audit()).toEqual([]);

  // Exercise interactive states, then audit again while their transitions run.
  const light = page.getByTestId("surface-light");
  await light.getByRole("button", { name: /მოვალ/ }).first().hover();
  await light.getByLabel(/სახელი/).first().focus();
  await light.getByRole("button", { name: /გაზრდა/ }).click();
  expect(await audit()).toEqual([]);
});

test("reduced motion: no sweep, no translate on reveal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, 390);
  const state = await page.evaluate(() => ({
    sweep: getComputedStyle(document.querySelector(".sweep-clip")!).display,
    unveil: getComputedStyle(document.querySelector(".unveil-inner")!).animationName,
    halo: getComputedStyle(document.querySelector(".halo[data-drift]")!).animationName,
  }));
  expect(state.sweep).toBe("none");
  expect(state.unveil).toBe("fade-in");
  expect(state.halo).toBe("fade-in");
});

test("template styleguide is noindex", async ({ page }) => {
  await page.goto("/styleguide/templates");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
