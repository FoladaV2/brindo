// Renders the editor's template thumbnails from the real templates (public/templates/<id>.webp).
// Each is the first screen of /preview/<id> (the full sample, with its photo) at phone proportions, 320 × 480 WebP.
// Needs a running server with previews enabled (`npm run dev`, or a build with STYLEGUIDE_ENABLED=true):
//   node scripts/build-thumbnails.mjs [baseUrl=http://localhost:3000]
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const TEMPLATES = ["lumiere", "noir"]; // keep in step with src/templates/registry.ts
const base = process.argv[2] ?? "http://localhost:3000";
const [width, height] = [320, 480];

const browser = await chromium.launch();
// Rendered at 360 × 540 (a phone's layout) and scaled down, at 2× for sharp type.
const page = await browser.newPage({ viewport: { width: 360, height: 540 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
for (const id of TEMPLATES) {
  const res = await page.goto(`${base}/preview/${id}`, { waitUntil: "networkidle" });
  if (!res?.ok()) throw new Error(`/preview/${id} answered ${res?.status()}; are previews enabled?`);
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500); // reduced motion: the fades settle well within this
  const png = (await page.screenshot()).toString("base64");
  const webp = await page.evaluate(
    async ({ png, width, height }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const canvas = Object.assign(document.createElement("canvas"), { width, height });
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL("image/webp", 0.82).split(",")[1];
    },
    { png, width, height },
  );
  const file = `public/templates/${id}.webp`;
  writeFileSync(file, Buffer.from(webp, "base64"));
  console.log(`${file}: ${Math.round((webp.length * 3) / 4 / 1024)} KB`);
}
await browser.close();
