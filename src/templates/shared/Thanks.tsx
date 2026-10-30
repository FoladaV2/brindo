"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import type { Copy } from "@content/copy.ka";
import { LogoMark } from "@/components/brand/logo";
import { fill } from "@/lib/text";
import { storageKey, useStoredAnswer } from "./rsvp-storage";

type ThanksCardProps = {
  strings: Copy["invitation"]["thanks"];
  closeLabel: string;
  /** Which saved answer to greet, and where closing the card goes. */
  rsvp: { slug: string; submit: "live" | "demo" };
  invitationHref: string;
  surface: "light" | "dark";
};

/**
 * The thank-you card a guest lands on after answering. Greets them by first name, read from their
 * own phone, so the name is never in the URL or sent anywhere. Opened without an answer on this
 * phone, it goes back to the invitation.
 */
export function ThanksCard({ strings: t, closeLabel, rsvp, invitationHref, surface }: ThanksCardProps) {
  const router = useRouter();
  const { stored, known } = useStoredAnswer(storageKey(rsvp));

  useEffect(() => {
    if (known && !stored) router.replace(invitationHref);
  }, [known, stored, router, invitationHref]);

  if (!stored) return null;

  return (
    <section aria-labelledby="thanks-title" className="thanks-card">
      <Link href={invitationHref} aria-label={closeLabel} className="thanks-close">
        <X size={20} strokeWidth={1.25} aria-hidden />
      </Link>
      <LogoMark size={36} tone={surface === "dark" ? "bone" : "onyx"} />
      <div className="grid gap-1.5">
        <h1 id="thanks-title" className="thanks-heading font-display text-balance">
          {fill(t.heading, { name: stored.answer.firstName })}
        </h1>
        <p className="text-body text-fg-muted">{stored.answer.attending ? t.yes : t.no}</p>
      </div>
      <div className="thanks-about">
        <p className="thanks-made">
          {t.madeWithBefore}
          <Link href="/">Brindo</Link>
          {t.madeWithAfter}
        </p>
        <p className="text-fg-muted">{t.about}</p>
        <p>{t.recommend}</p>
      </div>
      <Link href="/" className="btn btn-primary w-full">
        <span className="btn-label">
          {t.cta}
          <ArrowRight size={18} strokeWidth={1.25} aria-hidden />
        </span>
      </Link>
    </section>
  );
}
