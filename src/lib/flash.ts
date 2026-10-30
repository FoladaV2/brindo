import "server-only";
import { cookies } from "next/headers";
import { FLASH_COOKIE, type FlashKey } from "./flash-keys";

/** Shows a toast on the next page this browser opens (see flash-keys.ts). Call before redirect(). */
export async function flash(key: FlashKey) {
  (await cookies()).set(FLASH_COOKIE, key, {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
    // The toaster reads it in the browser; it holds only a key from a fixed list.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}
