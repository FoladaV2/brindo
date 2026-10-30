import { gzipSync } from "node:zlib";
import { expect, test, type Page } from "@playwright/test";

// Same platform family names as e2e/audits.ts
const ALLOWED_FONTS = ["TBC Contractica CAPS"];
const PAGES = {
  full: "/preview/lumiere",
  short: "/preview/lumiere/short",
  "noir-full": "/preview/noir",
  "noir-short": "/preview/noir/short",
} as const;
const JS_BUDGET_GZIP = 150 * 1024;

async function open(page: Page, path: string, width: number) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__brindoHydrated === true);
}

/** Let the entrance motion settle. The card has no scroll reveals. */
async function settle(page: Page) {
  await page.waitForTimeout(3200);
}

for (const [sample, path] of Object.entries(PAGES)) {
  for (const width of [360, 390, 430, 1366, 1440]) {
    test(`${sample}: screenshots and no horizontal scroll at ${width}px`, async ({ page }) => {
      await open(page, path, width);
      await settle(page);
      await page.screenshot({ path: `test-results/preview/${sample}-${width}-first-screen.png` });
      await page.screenshot({ path: `test-results/preview/${sample}-${width}.png`, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);

      // No word of the title overflows its frame.
      const lines = await page.evaluate(() =>
        [...document.querySelectorAll(".inv-title-line")].map((l) => ({ scroll: l.scrollWidth, client: l.clientWidth })),
      );
      expect(lines.length).toBeGreaterThan(0);
      for (const l of lines) expect(l.scroll).toBeLessThanOrEqual(l.client + 0.5);
    });
  }
  test(`${sample}: every text node renders in the brand fonts`, async ({ page }) => {
    await open(page, path, 390);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    await page.evaluate(() => {
      for (const el of document.body.querySelectorAll("*")) {
        if ([...el.childNodes].some((c) => c.nodeType === Node.TEXT_NODE && c.textContent!.trim())) el.setAttribute("data-font-check", "");
      }
    });
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "[data-font-check]" });
    const problems: string[] = [];
    for (const nodeId of nodeIds) {
      const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
      for (const f of fonts) {
        if (!f.isCustomFont || !ALLOWED_FONTS.some((name) => f.familyName.startsWith(name))) {
          const { outerHTML } = await cdp.send("DOM.getOuterHTML", { nodeId });
          problems.push(`${f.familyName} (${f.glyphCount} glyphs) in ${outerHTML.slice(0, 120)}`);
        }
      }
    }
    expect(nodeIds.length).toBeGreaterThan(sample.endsWith("full") ? 40 : 20);
    expect(problems, problems.join("\n")).toEqual([]);
  });
}

test("desktop: one fixed screen, and the answer buttons are always in view", async ({ page }) => {
  for (const [width, height] of [
    [1440, 900],
    [1366, 768],
  ]) {
    for (const path of [PAGES.full, PAGES["noir-full"], PAGES.short]) {
      await page.setViewportSize({ width, height });
      await page.goto(path);
      await page.waitForFunction(() => window.__brindoHydrated === true);
      const state = await page.evaluate(() => {
        const yes = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "მოვდივარ")!.getBoundingClientRect();
        return { page: document.documentElement.scrollHeight - innerHeight, yesBottom: yes.bottom, height: innerHeight };
      });
      expect(state.page, `${path} at ${width}x${height}: the page itself does not scroll`).toBeLessThanOrEqual(0);
      expect(state.yesBottom, `${path} at ${width}x${height}: the buttons are on screen`).toBeLessThanOrEqual(state.height);
    }
  }
});

test("reduced motion: no light sweep, entrances only fade", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, PAGES["noir-full"], 390);
  const state = await page.evaluate(() => ({
    sweep: getComputedStyle(document.querySelector(".sweep-clip")!).display,
    rise: getComputedStyle(document.querySelector(".inv-head")!).animationName,
  }));
  expect(state).toEqual({ sweep: "none", rise: "fade-in" });
});

test("Noir: dark surface, flat champagne title, the photo behind the page", async ({ page }) => {
  await open(page, PAGES["noir-full"], 390);
  const hero = await page.evaluate(() => ({
    surface: document.querySelector("article")!.getAttribute("data-surface"),
    title: getComputedStyle(document.querySelector(".inv-title")!).color,
    html: getComputedStyle(document.documentElement).backgroundColor,
    backdrop: document.querySelectorAll(".inv-backdrop img").length,
  }));
  expect(hero).toEqual({ surface: "dark", title: "rgb(217, 188, 132)", html: "rgb(20, 17, 15)", backdrop: 1 });
});

test("Lumière: the photo in an arched window", async ({ page }) => {
  await open(page, PAGES.full, 390);
  await expect(page.locator(".inv-arch img")).toHaveCount(1);
});

test("Noir RSVP: a yes plays The Toast on the dark surface", async ({ page }) => {
  await open(page, PAGES["noir-full"], 390);
  await page.getByLabel("სახელი", { exact: true }).fill("ნინო");
  await page.getByLabel("გვარი", { exact: true }).fill("ბერიძე");
  await page.getByRole("button", { name: "მოვდივარ", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: "test-results/preview/noir-toast-390.png" });
});


test("map buttons use universal links", async ({ page }) => {
  await open(page, PAGES.full, 390);
  await expect(page.getByRole("link", { name: /Google Maps/ })).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  await expect(page.getByRole("link", { name: /Apple Maps/ })).toHaveAttribute("href", /^https:\/\/maps\.apple\.com\/\?q=/);
});

test("RSVP: names, a party-size stepper capped at the invitation's limit, and two answers", async ({ page }) => {
  await open(page, PAGES.full, 390);
  await expect(page.getByLabel("სახელი", { exact: true })).toBeVisible();
  await expect(page.getByLabel("გვარი", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /შემცირება/ })).toBeDisabled(); // starts at 1
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: /გაზრდა/ }).click();
  await expect(page.getByRole("button", { name: /გაზრდა/ })).toBeDisabled(); // the sample's limit is 6
  await expect(page.getByRole("button", { name: "მოვდივარ", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "არ მოვდივარ", exact: true })).toBeVisible();
  await page.locator("section").filter({ hasText: "მობრძანდებით?" }).screenshot({ path: "test-results/preview/rsvp-section.png" });
  // Submitting is covered by rsvp.spec.ts (demo mode) and supabase/tests/rsvp.test.ts (the route).
});

test("short sample: no photo, no program, and still the RSVP form", async ({ page }) => {
  await open(page, PAGES.short, 390);
  await expect(page.locator("img.inv-photo, .inv-program")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "მოვდივარ", exact: true })).toBeVisible();
});

test(`initial JavaScript stays under ${JS_BUDGET_GZIP / 1024} KB gzipped`, async ({ page }) => {
  const scripts = new Map<string, number>();
  page.on("response", async (res) => {
    if (res.request().resourceType() !== "script") return;
    scripts.set(res.url(), gzipSync(await res.body(), { level: 9 }).length);
  });
  await open(page, PAGES.full, 390);
  await page.waitForLoadState("networkidle");
  const total = [...scripts.values()].reduce((a, b) => a + b, 0);
  const html = gzipSync(await (await page.request.get(PAGES.full)).body(), { level: 9 }).length;
  console.log(`JS: ${scripts.size} files, ${(total / 1024).toFixed(1)} KB gzipped; HTML (with inline RSC payload): ${(html / 1024).toFixed(1)} KB gzipped`);
  expect(total).toBeLessThan(JS_BUDGET_GZIP);
});

test("performance on slow 4G with 4x CPU throttling", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  // Lighthouse's "slow 4G" profile
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    const w = window as unknown as { __perf: { lcp: number; lcpEl: string; cls: number; longTasks: number[] } };
    w.__perf = { lcp: 0, lcpEl: "", cls: 0, longTasks: [] };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { element?: Element })[]) {
        w.__perf.lcp = e.startTime;
        w.__perf.lcpEl = e.element ? `${e.element.tagName}.${e.element.className}`.slice(0, 80) : "";
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) w.__perf.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) w.__perf.longTasks.push(Math.round(e.duration));
    }).observe({ type: "longtask", buffered: true });
  });

  await page.goto(PAGES.full, { waitUntil: "load" });
  await page.waitForTimeout(4000);
  const load = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
    const perf = (window as unknown as { __perf: { lcp: number; lcpEl: string; cls: number; longTasks: number[] } }).__perf;
    return { ...perf, fcp, ttfb: nav.responseStart, load: nav.loadEventEnd };
  });

  // Scroll the whole page in small steps and record frame gaps (jank) while the CPU is throttled.
  const frames = await page.evaluate(async () => {
    const gaps: number[] = [];
    let last = performance.now();
    let running = true;
    const loop = (t: number) => {
      gaps.push(t - last);
      last = t;
      if (running) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    for (let y = 0; y < document.body.scrollHeight; y += 40) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
    running = false;
    gaps.sort((a, b) => a - b);
    return {
      frames: gaps.length,
      p50: Math.round(gaps[Math.floor(gaps.length * 0.5)]),
      p95: Math.round(gaps[Math.floor(gaps.length * 0.95)]),
      over50ms: gaps.filter((g) => g > 50).length,
    };
  });
  console.log("perf", JSON.stringify({ ...load, scroll: frames }));
  expect(load.cls).toBeLessThan(0.05);
});
