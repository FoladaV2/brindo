/**
 * The Toast's bubbles: one canvas, at most 60 particles, drawn at most 30 times a second, paused
 * while the tab is hidden, and stopped for good once the last bubble fades. Never loops.
 */

export const MAX_PARTICLES = 60;
export const BUBBLE_COUNT = 40;
const FRAME_MS = 1000 / 30;
/** Bubbles start appearing over this long after the glasses touch. */
const SPAWN_SPREAD = 650;

// Where the bowls sit, measured from the canvas's bottom centre (see toast.css: the canvas spans
// the stage plus 8rem above it, and the glasses stand at the stage's bottom).
const BOWL_ABOVE_BOTTOM = 140;
const BOWL_OFFSET_X = 28;

export type Bubble = {
  x: number;
  y: number;
  /** Which glass: -1 left, 1 right. Bubbles drift away from the centre as they rise. */
  side: -1 | 1;
  r: number;
  filled: boolean;
  born: number;
  life: number;
  rise: number;
  drift: number;
  wobble: number;
  phase: number;
  alpha: number;
};

export function createBubbles(count: number, width: number, height: number, random: () => number = Math.random): Bubble[] {
  const n = Math.min(Math.max(0, count), MAX_PARTICLES);
  return Array.from({ length: n }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const filled = random() < 0.3;
    return {
      side,
      x: width / 2 + side * (BOWL_OFFSET_X + (random() - 0.5) * 18),
      y: height - BOWL_ABOVE_BOTTOM + (random() - 0.5) * 34,
      r: filled ? 0.8 + random() * 0.6 : 1.2 + random() * 2,
      filled,
      born: random() * SPAWN_SPREAD,
      life: 900 + random() * 500,
      rise: 140 + random() * 90,
      drift: random() * 18,
      wobble: 2 + random() * 4,
      phase: random() * Math.PI * 2,
      alpha: 0.55 + random() * 0.35,
    };
  });
}

/** A bubble's position and opacity `t` ms after the start, or null when it isn't on screen. */
export function bubbleAt(b: Bubble, t: number): { x: number; y: number; alpha: number } | null {
  const p = (t - b.born) / b.life;
  if (p < 0 || p >= 1) return null;
  const eased = 1 - (1 - p) ** 2;
  const fade = Math.min(1, p / 0.15) * Math.min(1, (1 - p) / 0.45);
  return {
    x: b.x + b.side * b.drift * p + Math.sin(b.phase + p * 7) * b.wobble,
    y: b.y - b.rise * eased,
    alpha: b.alpha * fade,
  };
}

/** True while any bubble has yet to appear or is still fading. */
export const anyLeft = (bubbles: Bubble[], t: number) => bubbles.some((b) => t < b.born + b.life);

/** Starts the bubbles on `canvas`. Returns a function that stops them and cleans up. */
export function startBubbles(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.scale(dpr, dpr);
  ctx.lineWidth = 1;

  const bubbles = createBubbles(BUBBLE_COUNT, width, height);
  let elapsed = 0;
  let last = 0;
  let sinceDraw = FRAME_MS;
  let raf = 0;
  let finished = false;

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    for (const b of bubbles) {
      const s = bubbleAt(b, elapsed);
      if (!s) continue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, b.r, 0, Math.PI * 2);
      if (b.filled) {
        ctx.fillStyle = `rgba(250, 240, 220, ${s.alpha.toFixed(3)})`;
        ctx.fill();
      } else {
        ctx.strokeStyle = `rgba(217, 188, 132, ${s.alpha.toFixed(3)})`;
        ctx.stroke();
      }
    }
  };

  const frame = (now: number) => {
    // Time only advances while frames run, so a hidden tab resumes where it left off.
    const dt = last ? Math.min(now - last, 100) : 0;
    last = now;
    elapsed += dt;
    sinceDraw += dt;
    if (sinceDraw >= FRAME_MS - 1) {
      sinceDraw = 0;
      if (!anyLeft(bubbles, elapsed)) {
        ctx.clearRect(0, 0, width, height);
        finished = true;
        raf = 0;
        document.removeEventListener("visibilitychange", onVisibility);
        return;
      }
      draw();
    }
    raf = requestAnimationFrame(frame);
  };

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!finished && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  document.addEventListener("visibilitychange", onVisibility);
  if (!document.hidden) raf = requestAnimationFrame(frame);

  return () => {
    finished = true;
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
