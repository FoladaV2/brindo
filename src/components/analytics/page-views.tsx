"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Sends one anonymous page view per page (src/lib/analytics). No cookies and no storage; the
 * server decides what, if anything, is recorded. Fire and forget: it never affects the page.
 */
export function PageViews() {
  const path = usePathname();
  const first = useRef(true);

  useEffect(() => {
    // The referring site matters only for the page someone arrived on.
    const referrer = first.current ? document.referrer : "";
    first.current = false;
    try {
      const body = new Blob([JSON.stringify({ path, referrer })], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/pv", body)) {
        void fetch("/api/pv", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    } catch {
      // Analytics never breaks a page.
    }
  }, [path]);

  return null;
}
