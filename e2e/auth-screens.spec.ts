import { expect, test, type Page } from "@playwright/test";
import { expectBrandFontsOnly, motionAudit } from "./audits";

// Sign-in, registration and onboarding as screens: layout, errors, fonts and motion. Needs no
// database (the real flows are in auth.spec.ts); onboarding runs at /preview/onboarding, which
// walks through the questions without saving.

async function open(page: Page, path: string, width: number) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("load");
  await page.waitForTimeout(600);
}

for (const width of [390, 1440]) {
  test(`login and registration at ${width}px`, async ({ page }) => {
    await open(page, "/login", width);
    await page.screenshot({ path: `test-results/auth-screens/login-${width}.png`, fullPage: true });

    await open(page, "/register", width);
    await page.screenshot({ path: `test-results/auth-screens/register-${width}.png`, fullPage: true });
    // An empty form is rejected on the server before any account call, with the error under the field.
    await page.getByRole("button", { name: "ანგარიშის შექმნა" }).click();
    await expect(page.getByText("გთხოვთ, შეიყვანოთ სწორი ელფოსტის მისამართი")).toBeVisible();
    await page.screenshot({ path: `test-results/auth-screens/register-error-${width}.png`, fullPage: true });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
  });

  test(`onboarding at ${width}px`, async ({ page }) => {
    await open(page, "/preview/onboarding", width);
    await page.screenshot({ path: `test-results/auth-screens/onboarding-intro-${width}.png` });
    await page.getByRole("button", { name: "დავიწყოთ" }).click();
    await expect(page.getByRole("heading", { name: "რას გეგმავთ?" })).toBeVisible();
    await page.screenshot({ path: `test-results/auth-screens/onboarding-q1-${width}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);

    // A tap answers and moves on by itself.
    await page.getByRole("radio", { name: "დაბადების დღეს" }).click();
    await expect(page.getByRole("heading", { name: "როდის არის ღონისძიება?" })).toBeVisible();

    // Back keeps the answer; skipping leaves a question unanswered.
    await page.getByRole("button", { name: "უკან" }).click();
    await expect(page.getByRole("radio", { name: "დაბადების დღეს" })).toBeChecked();
    await page.getByRole("button", { name: "შემდეგი" }).click();
    await page.getByRole("button", { name: "გამოტოვება", exact: true }).click();
    await expect(page.getByText("კითხვა 3 / 10")).toBeVisible();

    for (let i = 3; i <= 10; i++) {
      await expect(page.getByText(`კითხვა ${i} / 10`)).toBeVisible();
      await page.getByRole("radio").first().click();
    }
    await expect(page.getByRole("heading", { name: /მადლობა/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "მოსაწვევის შექმნა" })).toHaveAttribute("href", "/dashboard/invitations/new?type=birthday");
    await page.screenshot({ path: `test-results/auth-screens/onboarding-done-${width}.png` });
  });
}

test("keyboard: arrow keys choose an answer without leaving the question", async ({ page }) => {
  await open(page, "/preview/onboarding", 1440);
  await page.getByRole("button", { name: "დავიწყოთ" }).click();
  await page.getByRole("radio").first().focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.keyboard.press("ArrowDown");
  // Choosing with the keyboard never moves on by itself.
  await page.waitForTimeout(600);
  await expect(page.getByRole("heading", { name: "რას გეგმავთ?" })).toBeVisible();
  await page.getByRole("button", { name: "შემდეგი" }).click();
  await expect(page.getByRole("heading", { name: "როდის არის ღონისძიება?" })).toBeVisible();
});

test("password fields can be shown and hidden", async ({ page }) => {
  await open(page, "/login", 390);
  const password = page.getByLabel("პაროლი", { exact: true });
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "პაროლის ჩვენება" }).click();
  await expect(password).toHaveAttribute("type", "text");
});

test("auth and onboarding render only in the brand fonts and animate only transform and opacity", async ({ page }) => {
  await open(page, "/register", 1440);
  await expectBrandFontsOnly(page, 5, 10);
  expect(await motionAudit(page)).toEqual([]);

  await open(page, "/preview/onboarding", 1440);
  await page.getByRole("button", { name: "დავიწყოთ" }).click();
  await page.getByRole("radio").first().hover();
  expect(await motionAudit(page)).toEqual([]);
});
