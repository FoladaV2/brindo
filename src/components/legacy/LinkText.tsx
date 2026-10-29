import { clsx } from "clsx";

/**
 * An invitation link as text: no scheme, and on a narrow screen it wraps after the last slash or at
 * the slug's hyphens rather than mid-word. Copy buttons still copy the full URL.
 */
export function LinkText({ url, className }: { url: string; className?: string }) {
  const shown = url.replace(/^https?:\/\//, "");
  const cut = shown.lastIndexOf("/") + 1;
  return (
    <span className={clsx("[overflow-wrap:anywhere]", className)}>
      {shown.slice(0, cut)}
      <wbr />
      {shown.slice(cut)}
    </span>
  );
}
