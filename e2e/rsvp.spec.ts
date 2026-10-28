import { expect, test, type Page } from "@playwright/test";

// The RSVP flow on the preview page, where the form runs in demo mode (nothing is sent), so The
// Toast and every RSVP state can be checked without a database. Screenshots: test-results/rsvp/.

const PREVIEW = "/preview/lumiere";

/** Every CSS rule the page has loaded so far. */
const loadedCss = (page: Page) =>
  page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((sheet) => {
        try {
          return [...sheet.cssRules].map((rule) => rule.cssText);
        } catch {
          return [];
        }
      })
      .join(" "),
  );

async function openRsvp(page: Page, width: number, query = "") {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto(`${PREVIEW}${query}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__brindoHydrated === true);
  const section = page.locator("section").filter({ hasText: "მობრძანდებით?" });
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  return section;
}

test("The Toast is not part of the initial page: its code and CSS load only on Yes", async ({ page }) => {
  const loaded: string[] = [];
  page.on("response", (r) => loaded.push(r.url()));
  await openRsvp(page, 390);
  const before = loaded.length;
  expect(await loadedCss(page)).not.toContain("toast-burst");

  await page.getByText("მოვალ", { exact: true }).click();
  await page.getByRole("button", { name: "პასუხის გაგზავნა" }).click();
  await expect(page.locator(".toast")).toBeVisible();
  expect(loaded.length).toBeGreaterThan(before);
  expect(await loadedCss(page)).toContain("toast-burst");
});

for (const width of [390, 1440]) {
  test(`yes: The Toast plays once and closes to the saved answer at ${width}px`, async ({ page }) => {
    const section = await openRsvp(page, width);
    await page.screenshot({ path: `test-results/rsvp/${width}-form.png` });

    await page.getByText("მოვალ", { exact: true }).click();
    // The stepper starts at the guest's limit (3); come down to 2.
    await page.getByRole("button", { name: "შემცირება" }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `test-results/rsvp/${width}-yes-stepper.png` });

    await page.getByRole("button", { name: "პასუხის გაგზავნა" }).click();
    await expect(page.getByRole("button", { name: "პასუხის გაგზავნა" })).toHaveAttribute("aria-busy", "true");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("ნინო ბერიძე-ჩიქოვანი");

    // Mid-moment (glasses meeting, light burst, bubbles), then the settled picture.
    await page.waitForTimeout(1350);
    await page.screenshot({ path: `test-results/rsvp/${width}-toast-clink.png` });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `test-results/rsvp/${width}-toast-end.png` });

    const canvas = page.locator(".toast-bubbles");
    expect(await canvas.evaluate((c: HTMLCanvasElement) => c.width)).toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "კარგი" })).toBeFocused();

    await page.getByRole("button", { name: "კარგი" }).click();
    await expect(dialog).toBeHidden();
    await expect(section.locator(".rsvp-saved")).toContainText("მოვალ");
    await expect(section.locator(".rsvp-saved")).toContainText("2 სტუმარი");
    await expect(section.locator(".rsvp-saved")).toBeFocused();
    await page.waitForTimeout(1200);
    await section.screenshot({ path: `test-results/rsvp/${width}-saved-yes.png` });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`no: a quiet fade and a thank-you, then change the answer at ${width}px`, async ({ page }) => {
    const section = await openRsvp(page, width);
    await page.getByText("ვერ მოვალ", { exact: true }).click();
    await page.getByRole("button", { name: "პასუხის გაგზავნა" }).click();
    await expect(section.locator(".rsvp-saved")).toContainText("მადლობა, რომ შეგვატყობინეთ");
    await expect(page.locator(".toast")).toHaveCount(0);
    await page.waitForTimeout(1300);
    await section.screenshot({ path: `test-results/rsvp/${width}-saved-no.png` });

    await page.getByRole("button", { name: "პასუხის შეცვლა" }).click();
    await expect(page.getByRole("radio", { name: /ვერ მოვალ/ })).toBeChecked();
  });

  for (const state of ["yes", "closed", "closed-empty"]) {
    test(`saved state ${state} at ${width}px`, async ({ page }) => {
      const section = await openRsvp(page, width, `?rsvp=${state}`);
      await section.screenshot({ path: `test-results/rsvp/${width}-state-${state}.png` });
      if (state.startsWith("closed")) await expect(page.getByRole("button", { name: "პასუხის შეცვლა" })).toHaveCount(0);
    });
  }
}

test("reduced motion: The Toast is a static fade, with no particles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openRsvp(page, 390);
  await page.getByText("მოვალ", { exact: true }).click();
  await page.getByRole("button", { name: "პასუხის გაგზავნა" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".toast-bubbles")).toBeHidden();
  await expect(page.locator(".toast-burst")).toBeHidden();
  // Nothing moves: the glasses are already in their final pose, with no running animations.
  const animating = await page.evaluate(() =>
    document.getAnimations().filter((a) => a.effect && (a.effect as KeyframeEffect).target instanceof Element && ((a.effect as KeyframeEffect).target as Element).closest(".toast-stage, .toast-glass")).map((a) => (a as CSSAnimation).animationName),
  );
  expect(animating.filter((n) => n !== "toast-fade")).toEqual([]);
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test-results/rsvp/390-toast-reduced.png" });
});
