import { gzipSync } from "node:zlib";
import { expect, test, type Page } from "@playwright/test";

// Same platform family names as styleguide.spec.ts
const ALLOWED_FONTS = ["TBC Contractica CAPS", "Noto Sans Georgian"];
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

/** Scroll through so every Reveal fires, then return to the top and let motion settle. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(3200);
}

for (const [sample, path] of Object.entries(PAGES)) {
  for (const width of [360, 390, 430, 1440]) {
    test(`${sample}: screenshots and no horizontal scroll at ${width}px`, async ({ page }) => {
      await open(page, path, width);
      await settle(page);
      await page.screenshot({ path: `test-results/preview/${sample}-${width}-first-screen.png` });
      await page.screenshot({ path: `test-results/preview/${sample}-${width}.png`, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);

      // The hero names never overflow their frame.
      const names = await page.evaluate(() => {
        const frame = document.querySelector(".inv-names-frame")!.getBoundingClientRect();
        const lines = [...document.querySelectorAll(".inv-names .unveil-inner")].map((l) => l.getBoundingClientRect());
        return { frame: frame.width, widest: Math.max(...lines.map((l) => l.width)) };
      });
      expect(names.widest).toBeLessThanOrEqual(names.frame + 0.5);
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

test("reduced motion: no parallax, no light sweep, no masked unveil", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, PAGES.full, 390);
  const photo = page.locator(".inv-photo");
  await photo.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(300);
  const state = await page.evaluate(() => ({
    parallax: getComputedStyle(document.querySelector(".inv-parallax")!).transform,
    sweep: getComputedStyle(document.querySelector(".sweep-clip")!).display,
    unveil: getComputedStyle(document.querySelector(".unveil-inner")!).animationName,
    cue: getComputedStyle(document.querySelector(".inv-cue")!).animationName,
  }));
  expect(state.parallax).toBe("none");
  expect(state.sweep).toBe("none");
  expect(state.unveil).toBe("fade-in");
  expect(state.cue).toBe("fade-in");
});

test("Noir: dark surface, flat champagne names, framed photo that zooms only once in view", async ({ page }) => {
  await open(page, PAGES["noir-full"], 390);
  const hero = await page.evaluate(() => ({
    surface: document.querySelector("article")!.getAttribute("data-surface"),
    names: getComputedStyle(document.querySelector(".inv-names")!).color,
    html: getComputedStyle(document.documentElement).backgroundColor,
    zoom: getComputedStyle(document.querySelector(".inv-zoom")!).animationName,
  }));
  expect(hero).toEqual({ surface: "dark", names: "rgb(217, 188, 132)", html: "rgb(20, 17, 15)", zoom: "none" });
  await page.locator(".inv-framed").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator(".inv-zoom").evaluate((el) => getComputedStyle(el).animationName)).toBe("photo-zoom");
  expect(await page.locator(".inv-zoom").evaluate((el) => getComputedStyle(el).animationDuration)).toBe("20s");
});

test("Noir under reduced motion: no zoom, no light sweep", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, PAGES["noir-full"], 390);
  await page.locator(".inv-framed").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => ({
    zoom: getComputedStyle(document.querySelector(".inv-zoom")!).animationName,
    sweep: getComputedStyle(document.querySelector(".sweep-clip")!).display,
  }));
  expect(state).toEqual({ zoom: "none", sweep: "none" });
});

test("Noir RSVP: the chosen answer inverts to champagne, and Yes plays The Toast", async ({ page }) => {
  await open(page, PAGES["noir-full"], 390);
  const yes = page.locator(".inv-choice").first();
  await yes.click();
  expect(await yes.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(217, 188, 132)");
  await page.getByRole("button", { name: /პასუხის გაგზავნა/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: "test-results/preview/noir-toast-390.png" });
});

test("parallax moves the photo by at most 6% of its frame", async ({ page }) => {
  await open(page, PAGES.full, 390);
  const shifts: number[] = [];
  const top = await page.locator(".inv-photo").evaluate((el) => el.getBoundingClientRect().top + scrollY);
  for (const offset of [-800, -400, 0, 400]) {
    await page.evaluate((y) => window.scrollTo(0, y), top + offset);
    await page.waitForTimeout(120);
    shifts.push(
      await page.evaluate(() => {
        const frame = document.querySelector(".inv-photo")!.getBoundingClientRect().height;
        return new DOMMatrix(getComputedStyle(document.querySelector(".inv-parallax")!).transform).m42 / frame;
      }),
    );
  }
  expect(Math.max(...shifts.map(Math.abs))).toBeLessThanOrEqual(0.0601);
  expect(new Set(shifts.map((s) => s.toFixed(3))).size).toBeGreaterThan(1);
});

test("countdown renders no time on the server, then ticks on the client without hydration errors", async ({ page, request }) => {
  const html = await (await request.get(PAGES.full)).text();
  expect(html).not.toMatch(/inv-countdown-value" data-ready/);
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, PAGES.full, 390);
  const read = () => page.locator(".inv-countdown-value").allTextContents();
  await expect(page.locator(".inv-countdown-value[data-ready]")).toHaveCount(4);
  const first = await read();
  await page.waitForTimeout(1500);
  expect(await read()).not.toEqual(first);
  expect(errors).toEqual([]);
});

test("Add to calendar downloads a valid .ics file", async ({ page }) => {
  await open(page, PAGES.full, 390);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: /კალენდარში/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.ics$/);
  const res = await page.request.get(download.url());
  expect(res.headers()["content-type"]).toBe("text/calendar; charset=utf-8");
  const body = await res.text();
  expect(body).toMatch(/^BEGIN:VCALENDAR\r\n/);
  expect(body).toContain("DTSTART:20270612T130000Z");
  expect(body.replace(/\r\n /g, "")).toContain("SUMMARY:ქორწილი · ალექსანდრე ჯავახიშვილი & ელისაბედ ციციშვილი-ბაგრატიონი");
});

test("map buttons use universal links", async ({ page }) => {
  await open(page, PAGES.full, 390);
  await expect(page.getByRole("link", { name: /Google Maps/ })).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  await expect(page.getByRole("link", { name: /Apple Maps/ })).toHaveAttribute("href", /^https:\/\/maps\.apple\.com\/\?q=/);
});

test("RSVP: choosing Yes reveals the party-size stepper, starting at the guest's limit", async ({ page }) => {
  await open(page, PAGES.full, 390);
  const submit = page.getByRole("button", { name: /პასუხის გაგზავნა/ });
  await expect(submit).toBeDisabled();
  await page.getByText("ვერ მოვალ", { exact: true }).click();
  await expect(page.getByRole("group", { name: /სტუმრების რაოდენობა/ })).toHaveCount(0);
  await page.getByText("მოვალ", { exact: true }).click();
  await expect(page.getByRole("group", { name: /სტუმრების რაოდენობა/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /გაზრდა/ })).toBeDisabled(); // max party size 3
  await page.getByRole("button", { name: /შემცირება/ }).click();
  await page.getByRole("button", { name: /შემცირება/ }).click();
  await expect(page.getByRole("button", { name: /შემცირება/ })).toBeDisabled();
  await page.getByText("მოვალ", { exact: true }).screenshot({ path: "test-results/preview/rsvp-yes.png" });
  await page.locator("section").filter({ has: submit }).screenshot({ path: "test-results/preview/rsvp-yes-section.png" });
  // Submitting is covered by rsvp.spec.ts (demo mode) and supabase/tests/rsvp.test.ts (the route).
});

test("short sample without a guest shows no RSVP form", async ({ page }) => {
  await open(page, PAGES.short, 390);
  await expect(page.getByRole("button", { name: /პასუხის გაგზავნა/ })).toHaveCount(0);
  await expect(page.locator(".inv-photo, .inv-timeline")).toHaveCount(0);
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
