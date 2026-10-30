"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { clsx } from "clsx";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  /** Extra delay in ms, for staggering siblings (60–120ms apart). */
  delay?: number;
  className?: string;
};

/**
 * Fades up 24px once when it scrolls into view. Content is hidden only after an inline
 * script marks <html class="js">, and the layout un-hides it if hydration never happens.
 */
export function Reveal({ children, as: Tag = "div", delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.setAttribute("data-revealed", "");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={clsx("reveal", className)} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}
