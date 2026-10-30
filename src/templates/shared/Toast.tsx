"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { Copy } from "@content/copy.ka";
import { play } from "@/lib/sound";
import { startBubbles } from "./bubbles";
import "./toast.css";

export type ToastProps = {
  name: string;
  strings: Copy["invitation"]["rsvp"]["toast"];
  onDone: () => void;
};

/** When the glasses touch (ms after opening). Matches toast.css: rise delay + 72% of its duration. */
const CLINK_AT = 1250;
const CLOSE_DURATION = 320;

/**
 * The Toast: the brand's one theatrical moment, after a guest confirms. The screen dims to ink, two
 * line-drawn glasses rise and meet, a soft light bursts at the touch, bubbles rise, and a warm line
 * with the guest's name fades in, and the glasses clink (a synthesised sound, lib/sound.ts). About
 * 2.5 seconds; never loops. Loaded only when a guest says Yes.
 * Reduced motion: a static fade of the finished picture, no particles.
 */
export function Toast({ name, strings, onDone }: ToastProps) {
  const [closing, setClosing] = useState(false);
  const done = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    done.current?.focus({ preventScroll: true });

    let stop = () => {};
    const clink = setTimeout(
      () => {
        navigator.vibrate?.(12);
        play("clink");
        if (!reduced && canvas.current) stop = startBubbles(canvas.current);
      },
      reduced ? 0 : CLINK_AT,
    );
    return () => {
      clearTimeout(clink);
      stop();
      root.style.overflow = overflow;
    };
  }, []);

  const close = () => {
    if (closing) return;
    setClosing(true);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(onDone, reduced ? 0 : CLOSE_DURATION);
  };

  return createPortal(
    <div
      className="toast"
      data-surface="dark"
      data-closing={closing || undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="toast-line"
      aria-describedby="toast-name"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
        // The dialog has one control; keep focus on it.
        if (e.key === "Tab") {
          e.preventDefault();
          done.current?.focus();
        }
      }}
    >
      <div className="toast-dim" aria-hidden />
      <div className="toast-halo" aria-hidden />
      <div className="toast-body">
        <div className="toast-stage" aria-hidden>
          <span className="toast-burst" />
          <Glass side="left" />
          <Glass side="right" />
          <canvas ref={canvas} className="toast-bubbles" />
        </div>
        <p id="toast-line" className="toast-line font-display text-h2">
          {strings.line}
        </p>
        <p id="toast-name" className="toast-name font-display text-h3 text-balance">
          {name}
        </p>
        <p className="toast-sub text-body">{strings.sub}</p>
        <button ref={done} type="button" className="btn btn-primary toast-done" onClick={close}>
          <span className="btn-label">{strings.done}</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}

/** A champagne flute in thin line art. Each stroke draws on in turn (pathLength 1 + dash offset). */
function Glass({ side }: { side: "left" | "right" }) {
  return (
    <svg className="toast-glass" data-side={side} viewBox="0 0 60 160" fill="none">
      <path className="toast-stroke" style={{ "--d": "0ms" } as CSSProperties} pathLength={1} d="M14 8C14 40 18 66 30 74C42 66 46 40 46 8" />
      <path className="toast-stroke" style={{ "--d": "60ms" } as CSSProperties} pathLength={1} d="M14 8H46" />
      <path className="toast-stroke" style={{ "--d": "180ms" } as CSSProperties} pathLength={1} d="M30 74V143" />
      <path className="toast-stroke" style={{ "--d": "260ms" } as CSSProperties} pathLength={1} d="M16 146C21 141.5 39 141.5 44 146" />
      <path className="toast-stroke toast-liquid" style={{ "--d": "320ms" } as CSSProperties} pathLength={1} d="M16.5 35H43.5" />
    </svg>
  );
}
