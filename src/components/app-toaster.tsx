"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { FLASH_COOKIE, isFlashKey, type FlashKey } from "@/lib/flash-keys";
import { notify } from "@/lib/notify";

/**
 * The app's toaster (dashboard, sign-in, onboarding, admin). Also shows the toast a server action
 * left for this page before redirecting here (lib/flash.ts), then clears it. Messages arrive as
 * props so this client component doesn't pull the whole copy file into the bundle.
 */
export function AppToaster({ flash }: { flash: Record<FlashKey, string> }) {
  useEffect(() => {
    // A frame later, so the toaster beside this has subscribed. Read and cleared inside the frame,
    // so an effect that is cancelled and run again (React's strict mode) still shows it once.
    const frame = requestAnimationFrame(() => {
      const match = document.cookie.match(new RegExp(`(?:^|; )${FLASH_COOKIE}=([^;]*)`));
      if (!match) return;
      document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;
      const key = decodeURIComponent(match[1]);
      if (isFlashKey(key)) notify.success(flash[key]);
    });
    return () => cancelAnimationFrame(frame);
  }, [flash]);

  return <Toaster />;
}
