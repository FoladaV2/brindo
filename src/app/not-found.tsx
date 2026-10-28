import Link from "next/link";
import { copy } from "@content/copy.ka";
import { Divider } from "@/components/ui/Divider";
import { Grain } from "@/components/ui/Grain";
import { Halo } from "@/components/ui/Halo";
import { Wordmark } from "@/components/ui/Wordmark";

const t = copy.notFound;

/** Shown for unknown and unpublished invitation links too, so it says nothing about which it was. */
export default function NotFound() {
  return (
    <main data-surface="light" className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-clip px-gutter text-center">
      <Grain />
      <Halo />
      <h1 className="relative font-display text-h2 text-balance">{t.title}</h1>
      <Divider className="relative mt-10 w-28" />
      <p className="relative mt-10 max-w-[32ch] text-body text-fg-muted">{t.body}</p>
      <Link href="/" className="relative mt-16 flex min-h-tap flex-col items-center justify-center gap-3 text-small text-fg-muted">
        <Wordmark height={20} tone="light" />
        {t.home}
      </Link>
    </main>
  );
}
