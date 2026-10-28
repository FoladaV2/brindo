"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { copy } from "@content/copy.ka";
import { Message, stagger } from "./message";

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
          <div className="rise-in mt-10 flex flex-wrap justify-center gap-4" style={stagger(3)}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSlow(false);
                router.refresh();
              }}
            >
              <span className="btn-label">{t.slow.check}</span>
            </button>
            <Link href={editorHref} className="btn btn-secondary">
              <span className="btn-label">{t.backToEditor}</span>
            </Link>
          </div>
        </Message>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite">
      <Message label={t.confirming.label} heading={t.confirming.heading} body={t.confirming.body}>
        <span aria-hidden className="glide-track rise-in mt-10" style={stagger(3)}>
          <span className="glide-glint" />
        </span>
      </Message>
    </div>
  );
}
