import { expect, test, type Page } from "@playwright/test";
import { expectBrandFontsOnly, motionAudit } from "./audits";

// /admin itself needs an admin session and a database; here: that nobody else can see it, that
// page views never get in a page's way, and the layout with sample numbers (/preview/admin).

async function open(page: Page, width: number, path = "/preview/admin") {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("load");
  await page.waitForTimeout(500);
}

test("/admin, /admin/users and /admin/results answer 404 to anyone who isn't an admin", async ({ page }) => {
  for (const path of ["/admin", "/admin/users", "/admin/results"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(404);
    await expect(page.getByText("საიტის სტატისტიკა")).toHaveCount(0);
    await expect(page.getByText("@example.com")).toHaveCount(0);
  }
});

test("the page-view endpoint always answers 204, whatever it receives", async ({ request }) => {
  for (const data of ['{"path":"/"}', "not json", '{"path":42}', "x".repeat(5000), ""]) {
    const res = await request.post("/api/pv", { data, headers: { "content-type": "application/json" } });
    expect(res.status()).toBe(204);
  }
});

for (const width of [390, 1440]) {
  test(`admin layout with sample numbers at ${width}px`, async ({ page }) => {
    await open(page, width);
    await page.screenshot({ path: `test-results/admin/admin-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
}

for (const section of ["users", "results"]) {
  for (const width of [390, 1440]) {
    test(`admin ${section} with sample data at ${width}px`, async ({ page }) => {
      await open(page, width, `/preview/admin/${section}`);
      await page.screenshot({ path: `test-results/admin/${section}-${width}.png`, fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
  }
}

test("users: the search narrows the list by email", async ({ page }) => {
  await open(page, 1440, "/preview/admin/users");
  await page.getByRole("searchbox").fill("planner");
  await expect(page.getByRole("table").getByRole("link")).toHaveText(["planner@example.com"]);
});

test("results: the totals add up from the sample events", async ({ page }) => {
  await open(page, 1440, "/preview/admin/results");
  await expect(page.getByText("88% პასუხობს „მოვდივარ“")).toBeVisible(); // 296 of 335
  await expect(page.getByText("921", { exact: true })).toBeVisible();
});

test("the funnel shows each step's share of the one before and how many stopped", async ({ page }) => {
  await open(page, 1440);
  await expect(page.getByText("18% წინა ნაბიჯიდან")).toBeVisible(); // 184 of 1046 opened registration
  await expect(page.getByText("862 შეჩერდა")).toBeVisible();
  await page.getByRole("heading", { name: "ვიზიტორები დღეების მიხედვით" }).scrollIntoViewIfNeeded();
});

test("admin renders only in the brand fonts and animates only transform and opacity", async ({ page }) => {
  await open(page, 1440);
  await expectBrandFontsOnly(page, 10, 30);
  expect(await motionAudit(page)).toEqual([]);
});
