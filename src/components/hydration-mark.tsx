"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __brindoHydrated?: boolean;
  }
}

/**
 * Marks the page as hydrated. The boot script in the root layout un-hides scroll-reveal content if
 * this hasn't happened within 4s, and the e2e tests wait for it before interacting.
 */
export function HydrationMark() {
  useEffect(() => {
    window.__brindoHydrated = true;
  }, []);
  return null;
}
