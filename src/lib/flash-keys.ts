/**
 * Toasts that must survive a redirect (sign in, then the dashboard). The server sets a short-lived
 * cookie holding one of these keys; the next page's toaster shows the matching message and clears
 * it. Only a key from this list is ever read, so the cookie can't carry text into the page.
 */
export const FLASH_COOKIE = "brindo_flash";

export const FLASH_KEYS = ["signedIn", "registered", "signedOut", "created"] as const;
export type FlashKey = (typeof FLASH_KEYS)[number];

export const isFlashKey = (value: string): value is FlashKey => (FLASH_KEYS as readonly string[]).includes(value);
