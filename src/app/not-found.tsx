import Link from "next/link";
import { copy } from "@content/copy.ka";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const t = copy.notFound;

/** Shown for unknown and unpublished invitation links too, so it says nothing about which it was. */
export default function NotFound() {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-clip px-gutter-brand py-16 text-center">
      <div aria-hidden="true" className="absolute top-0 left-1/2 -z-10 size-[44rem] -translate-x-1/2 -translate-y-1/3 bg-(image:--glow-wine)" />
      <div className="grid max-w-md justify-items-center gap-6">
        <Logo height={20} />
        <h1 className="mt-6 font-display text-title text-balance">{t.title}</h1>
        <p className="text-muted-foreground">{t.body}</p>
        <Button asChild variant="outline">
          <Link href="/">{t.home}</Link>
        </Button>
      </div>
    </main>
  );
}
