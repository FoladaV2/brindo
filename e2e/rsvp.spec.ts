import { expect, test, type Page } from "@playwright/test";

// The open RSVP form on the preview page, where it runs in demo mode (nothing is sent), so The
// Toast and every answer state can be checked without a database. Screenshots: test-results/rsvp/.

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

async function fillNames(page: Page, first = "ნინო", last = "ბერიძე-ჩიქოვანი") {
  await page.getByLabel("სახელი", { exact: true }).fill(first);
  await page.getByLabel("გვარი", { exact: true }).fill(last);
}

const yes = (page: Page) => page.getByRole("button", { name: "მოვდივარ", exact: true });
const no = (page: Page) => page.getByRole("button", { name: "არ მოვდივარ", exact: true });

test("The Toast is not part of the initial page: its code and CSS load only on a yes", async ({ page }) => {
  const loaded: string[] = [];
  page.on("response", (r) => loaded.push(r.url()));
  await openRsvp(page, 390);
  const before = loaded.length;
  expect(await loadedCss(page)).not.toContain("toast-burst");

  await fillNames(page);
  await yes(page).click();
  await expect(page.locator(".toast")).toBeVisible();
  expect(loaded.length).toBeGreaterThan(before);
  expect(await loadedCss(page)).toContain("toast-burst");
});

test("names are required, and the error sits under the empty field", async ({ page }) => {
  await openRsvp(page, 390);
  await page.getByLabel("სახელი", { exact: true }).fill("ნინო");
  await yes(page).click();
  await expect(page.getByText("შეიყვანეთ გვარი")).toBeVisible();
  await expect(page.getByLabel("გვარი", { exact: true })).toBeFocused();
  await expect(page.locator(".toast")).toHaveCount(0);
});

for (const width of [390, 1440]) {
  test(`yes: The Toast plays once and closes to the saved answer at ${width}px`, async ({ page }) => {
    const section = await openRsvp(page, width);
    await page.screenshot({ path: `test-results/rsvp/${width}-form.png` });

    await fillNames(page);
    // The count starts at 1; four people in total.
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "გაზრდა" }).click();
    await page.waitForTimeout(300);
    await section.screenshot({ path: `test-results/rsvp/${width}-filled.png` });

    await yes(page).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("ნინო");

    // Mid-moment (glasses meeting, light burst, bubbles), then the settled picture.
    await page.waitForTimeout(1350);
    await page.screenshot({ path: `test-results/rsvp/${width}-toast-clink.png` });
    await page.waitForTimeout(1500);

    await page.getByRole("button", { name: "კარგი" }).click();
    await expect(dialog).toBeHidden();
    const saved = section.locator(".rsvp-saved");
    await expect(saved).toContainText("მოვდივარ");
    await expect(saved).toContainText("4 ადამიანი");
    await expect(saved).toContainText("ნინო ბერიძე-ჩიქოვანი");
    await expect(saved).toBeFocused();
    await page.waitForTimeout(1200);
    await section.screenshot({ path: `test-results/rsvp/${width}-saved-yes.png` });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`no: a quiet thank-you, then change the answer at ${width}px`, async ({ page }) => {
    const section = await openRsvp(page, width);
    await fillNames(page, "ლევან", "ჯანელიძე");
    await no(page).click();
    await expect(section.locator(".rsvp-saved")).toContainText("მადლობა, რომ შეგვატყობინეთ");
    await expect(page.locator(".toast")).toHaveCount(0);
    await page.waitForTimeout(1300);
    await section.screenshot({ path: `test-results/rsvp/${width}-saved-no.png` });

    await page.getByRole("button", { name: "პასუხის შეცვლა" }).click();
    await expect(page.getByLabel("სახელი", { exact: true })).toHaveValue("ლევან");
    await expect(page.getByLabel("გვარი", { exact: true })).toHaveValue("ჯანელიძე");
  });
}

test("the answer stays on the phone: reopening the link shows it, not a blank form", async ({ page }) => {
  await openRsvp(page, 390);
  await fillNames(page, "მარიამ", "ჯაში");
  await no(page).click();
  await expect(page.locator(".rsvp-saved")).toContainText("მარიამ ჯაში");
  await page.reload();
  const section = await openRsvp(page, 390);
  await expect(section.locator(".rsvp-saved")).toContainText("არ მოვდივარ");
});

test("past the deadline the form is closed", async ({ page }) => {
  const section = await openRsvp(page, 390, "?rsvp=closed");
  await expect(section).toContainText("პასუხების მიღება დასრულდა");
  await expect(yes(page)).toHaveCount(0);
  await section.screenshot({ path: "test-results/rsvp/390-closed.png" });
});

test("a birthday invitation: one title in the hero, the same form", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PREVIEW}?event=birthday`);
  await expect(page.locator("h1")).toContainText("ანას");
  await expect(page.locator("h1")).not.toContainText("&");
  await expect(page.getByText("დაბადების დღე").first()).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/rsvp/390-birthday-hero.png" });
});

test("reduced motion: The Toast is a static fade, with no particles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openRsvp(page, 390);
  await fillNames(page);
  await yes(page).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".toast-bubbles")).toBeHidden();
  await expect(page.locator(".toast-burst")).toBeHidden();
  // Nothing moves: the glasses are already in their final pose, with no running animations.
  const animating = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.effect && (a.effect as KeyframeEffect).target instanceof Element && ((a.effect as KeyframeEffect).target as Element).closest(".toast-stage, .toast-glass"))
      .map((a) => (a as CSSAnimation).animationName),
  );
  expect(animating.filter((n) => n !== "toast-fade")).toEqual([]);
});
