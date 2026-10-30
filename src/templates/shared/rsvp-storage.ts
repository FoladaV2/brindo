import { useMemo, useSyncExternalStore } from "react";

/**
 * The guest's answer lives on their phone (SPEC.md "Open RSVP"): the edit token from the server and
 * a copy of what they sent, so opening the link again shows their answer instead of a blank form,
 * and the thank-you page can greet them without their name ever being in a URL.
 */
export type Answer = { firstName: string; lastName: string; attending: boolean; partySize: number | null };
export type Stored = { token: string | null; answer: Answer };

const STORAGE_EVENT = "brindo:rsvp";

export const storageKey = (rsvp: { slug: string; submit: "live" | "demo" }) =>
  rsvp.submit === "demo" ? `brindo:rsvp:demo:${rsvp.slug}` : `brindo:rsvp:${rsvp.slug}`;

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: Stored) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage full: the answer is saved on the server all the same.
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function parseStored(raw: string | null | undefined): Stored | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Stored;
    return value && typeof value.answer?.firstName === "string" && typeof value.answer.attending === "boolean" ? value : null;
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}

/** The saved answer. `known` is false during server rendering and hydration, when it can't be read yet. */
export function useStoredAnswer(key: string): { stored: Stored | null; known: boolean } {
  const raw = useSyncExternalStore(subscribe, () => readStored(key), () => undefined);
  const stored = useMemo(() => parseStored(raw), [raw]);
  return { stored, known: raw !== undefined };
}
