import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Brand and template type sizes are custom; without this, tailwind-merge reads `text-hero`
// as a color and drops it next to `text-onyx`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["hero", "title", "heading", "lead", "eyebrow", "display", "h2", "h3", "body", "ui", "small", "label"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
