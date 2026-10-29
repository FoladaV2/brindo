// Renders the home page's template phones from the real templates (public/marketing/<id>.webp).
// Each is the first screen of /preview/<id> on a 390 × 844 phone at 2×, saved as 780 × 1688 WebP.
// Needs a running server with previews enabled (`npm run dev`, or a build with STYLEGUIDE_ENABLED=true):
//   node scripts/build-marketing-shots.mjs [baseUrl=http://localhost:3000]
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const TEMPLATES = ["lumiere", "noir"]; // keep in step with src/templates/registry.ts
const base = process.argv[2] ?? "http://localhost:3000";
const [width, height] = [390, 844];

mkdirSync("public/marketing", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, reducedMotion: "reduce" });
for (const id of TEMPLATES) {
  const res = await page.goto(`${base}/preview/${id}`, { waitUntil: "networkidle" });
  if (!res?.ok()) throw new Error(`/preview/${id} answered ${res?.status()}; are previews enabled?`);
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500); // reduced motion: the fades settle well within this
  const png = (await page.screenshot()).toString("base64");
  const webp = await page.evaluate(
    async ({ png }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const canvas = Object.assign(document.createElement("canvas"), { width: img.width, height: img.height });
      canvas.getContext("2d").drawImage(img, 0, 0);
      return canvas.toDataURL("image/webp", 0.8).split(",")[1];
    },
    { png },
  );
  const file = `public/marketing/${id}.webp`;
  writeFileSync(file, Buffer.from(webp, "base64"));
  console.log(`${file}: ${Math.round((webp.length * 3) / 4 / 1024)} KB`);
}
await browser.close();
