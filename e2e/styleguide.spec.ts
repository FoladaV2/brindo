import { expect, test, type Page } from "@playwright/test";

// Platform family names, as Chrome reports them (weights may add a suffix, e.g. "… Medium").
const ALLOWED_FONTS = ["TBC Contractica CAPS", "Noto Sans Georgian"];
const ANIMATABLE = new Set([
  "transform",
  "opacity",
  "translate",
  "scale",
  "rotate",
  "clip-path",
  "mask",
  "mask-position",
  "-webkit-mask-position",
  "animation-timing-function",
]);

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto("/styleguide");
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
      await page.getByTestId(`surface-${surface}`).screenshot({ path: `test-results/styleguide/${surface}-${width}.png` });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
  });
}

test("every text node renders in the brand fonts, with no system fallback", async ({ page }) => {
  await open(page, 1440);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");

  // Mark every element that owns visible text directly.
  const count = await page.evaluate(() => {
    let n = 0;
    for (const el of document.body.querySelectorAll("*")) {
      const own = [...el.childNodes].some((c) => c.nodeType === Node.TEXT_NODE && c.textContent!.trim());
      if (own) {
        el.setAttribute("data-font-check", "");
        n++;
      }
    }
    return n;
  });
  expect(count).toBeGreaterThan(50);

  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "[data-font-check]" });

  const problems: string[] = [];
  let georgianNodes = 0;
  for (const nodeId of nodeIds) {
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    const { outerHTML } = await cdp.send("DOM.getOuterHTML", { nodeId });
    if (/[Ⴀ-ჿ]/.test(outerHTML)) georgianNodes++;
    for (const f of fonts) {
      if (!f.isCustomFont || !ALLOWED_FONTS.some((name) => f.familyName.startsWith(name))) {
        problems.push(`${f.familyName} (${f.glyphCount} glyphs, custom=${f.isCustomFont}) in ${outerHTML.slice(0, 120)}`);
      }
    }
  }
  expect(georgianNodes).toBeGreaterThan(20);
  expect(problems, problems.join("\n")).toEqual([]);
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
  const audit = () =>
    page.evaluate((allowed) => {
      const ok = new Set(allowed);
      const out: string[] = [];
      const walk = (rules: CSSRuleList) => {
        for (const r of rules) {
          if (r instanceof CSSKeyframesRule) {
            for (const kf of r.cssRules) {
              const style = (kf as CSSKeyframeRule).style;
              for (let i = 0; i < style.length; i++) if (!ok.has(style[i])) out.push(`@keyframes ${r.name}: ${style[i]}`);
            }
          } else if ("cssRules" in r) walk((r as CSSGroupingRule).cssRules);
        }
      };
      for (const sheet of document.styleSheets) walk(sheet.cssRules);

      for (const el of document.querySelectorAll("*")) {
        for (const pseudo of [null, "::before", "::after"]) {
          const cs = getComputedStyle(el, pseudo);
          const props = cs.transitionProperty.split(",").map((s) => s.trim());
          const durs = cs.transitionDuration.split(",").map((s) => parseFloat(s));
          props.forEach((p, i) => {
            if (durs[i % durs.length] > 0 && !ok.has(p)) out.push(`${el.className || el.tagName}${pseudo ?? ""}: transition ${p}`);
          });
        }
      }
      for (const a of document.getAnimations()) {
        const kfs = (a.effect as KeyframeEffect).getKeyframes();
        for (const kf of kfs)
          for (const k of Object.keys(kf))
            if (!["offset", "easing", "composite", "computedOffset"].includes(k) && !ok.has(k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())))
              out.push(`running animation: ${k}`);
      }
      return [...new Set(out)];
    }, [...ANIMATABLE]);

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

test("styleguide is noindex", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
