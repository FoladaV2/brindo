// WCAG 2.x contrast math and a tiny parser for src/styles/tokens.css.

export function parseColor(value) {
  const v = value.trim().toLowerCase();
  let m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) {
    const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: 1 };
  }
  m = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[/,]\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  throw new Error(`Unsupported color: ${value}`);
}

/** Composite a (possibly translucent) foreground over an opaque background. */
export function over(fg, bg) {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

function channel(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(fg, bg) {
  const base = parseColor(bg);
  const top = over(parseColor(fg), base);
  const [hi, lo] = [luminance(top), luminance(base)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Return { [selector]: { [prop]: value } } for the simple blocks in tokens.css. */
export function parseBlocks(css) {
  const blocks = {};
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = {};
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls[d[1]] = d[2].trim();
    for (const sel of m[1].split(",").map((s) => s.trim())) {
      blocks[sel] = { ...(blocks[sel] ?? {}), ...decls };
    }
  }
  return blocks;
}

/** Resolve a token for a surface: surface block first, then :root, following var() references. */
export function resolver(blocks, surfaceSelector) {
  const scope = { ...blocks[":root"], ...blocks[surfaceSelector] };
  const resolve = (name, seen = new Set()) => {
    if (seen.has(name)) throw new Error(`Cycle at ${name}`);
    seen.add(name);
    const raw = scope[name];
    if (raw === undefined) throw new Error(`Unknown token ${name} in ${surfaceSelector}`);
    const ref = raw.match(/^var\((--[\w-]+)\)$/);
    return ref ? resolve(ref[1], seen) : raw;
  };
  return resolve;
}
