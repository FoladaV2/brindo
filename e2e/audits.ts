import { expect, type Page } from "@playwright/test";

// Platform family names, as Chrome reports them (weights may add a suffix, e.g. "… Medium").
export const ALLOWED_FONTS = ["TBC Contractica CAPS", "Noto Sans Georgian"];
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

/** Every element that owns visible text renders only in the brand fonts, with no system fallback. */
export async function expectBrandFontsOnly(page: Page, minGeorgianNodes = 20, minTextNodes = 50) {
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
  expect(count).toBeGreaterThan(minTextNodes);

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
  expect(georgianNodes).toBeGreaterThan(minGeorgianNodes);
  expect(problems, problems.join("\n")).toEqual([]);
}

/** Lists anything that animates or transitions a property other than transform and opacity (and masks). */
export function motionAudit(page: Page) {
  return page.evaluate((allowed) => {
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
          if (durs[i % durs.length] > 0 && p !== "none" && !ok.has(p)) out.push(`${el.className || el.tagName}${pseudo ?? ""}: transition ${p}`);
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
}
