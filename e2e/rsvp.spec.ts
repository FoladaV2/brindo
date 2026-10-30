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
  test(`yes: The Toast, then the thank-you card, at ${width}px`, async ({ page }) => {
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

    // The guest doesn't have to tap anything: The Toast closes by itself.
    await page.waitForURL(/\/preview\/lumiere\/thanks/);
    const card = page.locator(".thanks-card");
    await expect(page.getByRole("heading", { name: "მადლობა, ნინო!" })).toBeVisible();
    await expect(card).toContainText("გელოდებით");
    await expect(card.getByRole("link", { name: "Brindo", exact: true })).toHaveAttribute("href", "/");
    await page.waitForTimeout(900);
    await page.screenshot({ path: `test-results/rsvp/${width}-thanks-yes.png` });

    // The name stays on the phone: it's in no URL.
    expect(decodeURI(page.url())).not.toContain("ნინო");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    // Closing goes back to the invitation, which shows the saved answer.
    await page.getByRole("link", { name: "დახურვა" }).click();
    const saved = section.locator(".rsvp-saved");
    await expect(saved).toContainText("მოვდივარ");
    await expect(saved).toContainText("4 ადამიანი");
    await expect(saved).toContainText("ნინო ბერიძე-ჩიქოვანი");
    await page.waitForTimeout(1200);
    await section.screenshot({ path: `test-results/rsvp/${width}-saved-yes.png` });
  });

  test(`no: straight to the thank-you card, then change the answer, at ${width}px`, async ({ page }) => {
    const section = await openRsvp(page, width);
    await fillNames(page, "ლევან", "ჯანელიძე");
    await no(page).click();
    await page.waitForURL(/\/preview\/lumiere\/thanks/);
    await expect(page.locator(".toast")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "მადლობა, ლევან!" })).toBeVisible();
    await expect(page.locator(".thanks-card")).toContainText("მადლობა, რომ შეგვატყობინეთ");
    await page.waitForTimeout(900);
    await page.screenshot({ path: `test-results/rsvp/${width}-thanks-no.png` });

    await page.getByRole("link", { name: "დახურვა" }).click();
    await page.getByRole("button", { name: "პასუხის შეცვლა" }).click();
    await expect(page.getByLabel("სახელი", { exact: true })).toHaveValue("ლევან");
    await expect(page.getByLabel("გვარი", { exact: true })).toHaveValue("ჯანელიძე");
    await section.screenshot({ path: `test-results/rsvp/${width}-change.png` });
  });
}

test("the thank-you card without an answer on this phone goes back to the invitation", async ({ page }) => {
  await page.goto("/preview/lumiere/thanks?slug=preview-lumiere");
  await page.waitForURL(/\/preview\/lumiere$/);
  await expect(page.getByRole("heading", { name: "მობრძანდებით?" })).toBeVisible();
});

test("the answer stays on the phone: reopening the link shows it, not a blank form", async ({ page }) => {
  await openRsvp(page, 390);
  await fillNames(page, "მარიამ", "ჯაში");
  await no(page).click();
  await page.waitForURL(/\/thanks/);
  const section = await openRsvp(page, 390);
  await expect(section.locator(".rsvp-saved")).toContainText("მარიამ ჯაში");
  await expect(section.locator(".rsvp-saved")).toContainText("არ მოვდივარ");
});

test("phones: a button stays in reach until the reply card is on screen, then steps aside", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PREVIEW);
  await page.waitForFunction(() => window.__brindoHydrated === true);
  const bar = page.locator(".inv-replybar");
  await expect(bar).not.toHaveAttribute("data-hidden");
  await bar.getByRole("link", { name: "პასუხის გაცემა" }).click();
  await expect(page.locator("#reply")).toBeInViewport();
  await expect(bar).toHaveAttribute("data-hidden", "true");
});

test("the program folds away when it's long, and opens with a tap", async ({ page }) => {
  await page.goto(PREVIEW);
  const item = page.getByText("ჯვრისწერა სამების საკათედრო ტაძარში");
  await expect(item).toBeHidden();
  await page.getByText("5 პუნქტი").click();
  await expect(item).toBeVisible();
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
