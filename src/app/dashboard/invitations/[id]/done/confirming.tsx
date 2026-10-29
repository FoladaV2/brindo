"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/button";
import { Message } from "./message";

const t = copy.payment.done;

/** The webhook usually lands within seconds; check every 2s for about 40s, then say so calmly. */
const POLL_MS = 2000;
const MAX_POLLS = 20;

/**
 * Shown while the order is pending. Re-renders the page from the server (which reads the
 * database) until it shows the published state; never trusts anything in the URL.
 */
export function ConfirmingPayment({ editorHref }: { editorHref: string }) {
  const router = useRouter();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (slow) return;
    let polls = 0;
    const timer = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      polls += 1;
      if (polls > MAX_POLLS) {
        clearInterval(timer);
        setSlow(true);
        return;
      }
      router.refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [router, slow]);

  if (slow) {
    return (
      <div role="status" aria-live="polite">
        <Message label={t.confirming.label} heading={t.slow.heading} body={t.slow.body}>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                setSlow(false);
                router.refresh();
              }}
            >
              {t.slow.check}
            </Button>
            <Button asChild variant="outline">
              <Link href={editorHref}>{t.backToEditor}</Link>
            </Button>
          </div>
        </Message>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite">
      <Message label={t.confirming.label} heading={t.confirming.heading} body={t.confirming.body}>
        <Loader2 className="mt-4 size-6 animate-spin text-primary motion-reduce:animate-none" strokeWidth={2} aria-hidden />
      </Message>
    </div>
  );
}
