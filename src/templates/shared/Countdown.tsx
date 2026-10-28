"use client";

import { useSyncExternalStore } from "react";
import { clsx } from "clsx";
import { countdown } from "@/lib/invitations/datetime";

// One shared clock that ticks on each whole second while the tab is visible.
const listeners = new Set<() => void>();
let now: number | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function tick() {
  now = Date.now();
  listeners.forEach((l) => l());
  timer = setTimeout(tick, 1000 - (now % 1000) + 5);
}

function onVisibility() {
  clearTimeout(timer);
  if (!document.hidden) tick();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      now = null;
    }
  };
}

// The server (and hydration) renders no time at all, so the markup never depends on when it was made.
const getServerSnapshot = () => null;
const getSnapshot = () => (now === null ? null : Math.floor(now / 1000));

type CountdownProps = {
  /** Event moment, epoch ms. */
  target: number;
  /** Days, hours, minutes, seconds */
  units: readonly string[];
  label: string;
  className?: string;
};

/** Days, hours, minutes and seconds until the event, separated by hairlines. Numbers fade in on the client. */
export function Countdown({ target, units, label, className }: CountdownProps) {
  const seconds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const left = seconds === null ? null : countdown(target, seconds * 1000);
  const values = left && [String(left.days), ...[left.hours, left.minutes, left.seconds].map((n) => String(n).padStart(2, "0"))];

  return (
    <div role="timer" aria-label={label} className={clsx("inv-countdown", className)}>
      {units.map((unit, i) => (
        <div key={unit} className="inv-countdown-cell">
          <span className="inv-countdown-value" data-ready={values ? "" : undefined} aria-hidden={!values}>
            {values ? values[i] : "00"}
          </span>
          <span className="label">{unit}</span>
        </div>
      ))}
    </div>
  );
}
