"use client";

import { useEffect, useState } from "react";
import type { InvitationRsvp } from "../types";
import { storageKey, useStoredAnswer } from "./rsvp-storage";

/**
 * Phones only: a button that stays in reach and jumps to the reply card, so a guest never has to
 * hunt for where to answer. Leaves once the card is on screen, or once they have answered.
 */
export function ReplyBar({ rsvp, label }: { rsvp: InvitationRsvp; label: string }) {
  const { stored } = useStoredAnswer(storageKey(rsvp));
  const [cardInView, setCardInView] = useState(false);

  useEffect(() => {
    const card = document.getElementById("reply");
    if (!card) return;
    const observer = new IntersectionObserver(([entry]) => setCardInView(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const hidden = cardInView || stored !== null;
  return (
    <div className="inv-replybar" data-hidden={hidden || undefined}>
      <a href="#reply" className="btn btn-primary w-full" tabIndex={hidden ? -1 : undefined} aria-hidden={hidden || undefined}>
        <span className="btn-label">{label}</span>
      </a>
    </div>
  );
}
