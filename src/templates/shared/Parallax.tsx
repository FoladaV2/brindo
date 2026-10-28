"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { clsx } from "clsx";

/** Travel in each direction, as a share of the frame's height. */
const RANGE = 0.06;

/**
 * Moves its content up to ±6% of the parent frame's height as the frame crosses the viewport.
 * Transform only, one rAF per scroll frame, and only while the frame is on screen.
 * Does nothing under reduced motion. Size it 12% taller than the frame, starting 6% above it.
 */
export function Parallax({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const frame = el?.parentElement;
    if (!el || !frame || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = frame.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight - rect.top) / (innerHeight + rect.height)));
      el.style.transform = `translate3d(0, ${((progress - 0.5) * 2 * RANGE * rect.height).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      } else {
        removeEventListener("scroll", onScroll);
      }
    });
    observer.observe(frame);
    return () => {
      observer.disconnect();
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={clsx("inv-parallax", className)}>
      {children}
    </div>
  );
}
