"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { copy } from "@content/copy.ka";
import { cn } from "@/lib/utils";

const t = copy.home.hero;
const TOTAL = 186;
/** Matches .hero-float-a's animation delay in marketing.css. */
const COUNT_DELAY_MS = 900;

/**
 * The product in action: a guest's view of an invitation on a phone, the host's live counter,
 * and new answers arriving. Decorative (the copy beside it says the same), so hidden from
 * assistive tech. Behind it, the signature moment: two rims drift together and touch, and a soft
 * wine glow blooms at the point of contact (CSS, once; reduced motion shows the end state).
 */
export function HeroVisual() {
  const [count, setCount] = useState(TOTAL);
  const [toast, setToast] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Count up once, starting as the counter card fades in (900ms), then cycle the arriving answers.
    let frame = 0;
    const start = performance.now() + COUNT_DELAY_MS;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / 1600));
      setCount(Math.round(TOTAL * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const id = window.setInterval(() => setToast((i) => (i + 1) % t.toast.length), 2800);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(id);
    };
  }, []);

  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[26rem] select-none lg:max-w-none">
      {/* Signature: the clink */}
      <div className="hero-clink pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[34rem] -translate-x-1/2 -translate-y-1/2 md:size-[40rem]">
        <span className="hero-glow absolute inset-0 bg-(image:--glow-wine)" />
        <span className="hero-rim hero-rim-l absolute top-1/2 left-1/2 size-[58%] rounded-full border border-foreground/10" />
        <span className="hero-rim hero-rim-r absolute top-1/2 left-1/2 size-[58%] rounded-full border border-foreground/10" />
      </div>

      {/* Phone */}
      <div className="hero-phone relative mx-auto w-[17.5rem] rounded-phone border-[10px] border-onyx bg-onyx shadow-float md:w-[19rem]">
        <div className="overflow-hidden rounded-[2.1rem] bg-lift">
          <div className="flex h-7 items-center justify-center">
            <span className="h-1.5 w-16 rounded-full bg-onyx/90" />
          </div>
          <div className="grid gap-5 px-5 pt-3 pb-6">
            <div className="grid gap-1.5 text-center">
              <span className="text-xs text-muted-foreground">{t.phone.eventType}</span>
              <span className="font-display text-[2.6rem] leading-none">{t.phone.title}</span>
              <span className="mt-1 text-xs text-muted-foreground">{t.phone.date}</span>
              <span className="text-xs text-muted-foreground">{t.phone.venue}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="grid gap-3">
              <span className="text-center font-display text-lg">{t.phone.question}</span>
              <div className="grid grid-cols-2 gap-2">
                <FakeInput label={t.phone.firstName} value={t.phone.firstNameValue} />
                <FakeInput label={t.phone.lastName} value={t.phone.lastNameValue} />
              </div>
              <div className="grid gap-1">
                <span className="text-[0.6875rem] font-medium">{t.phone.count}</span>
                <div className="flex h-10 items-center justify-between rounded-[10px] border border-input bg-card px-1.5">
                  <span className="grid size-7 place-items-center rounded-full bg-secondary">
                    <Minus className="size-3.5" strokeWidth={2} />
                  </span>
                  <span className="tabular text-base font-medium">4</span>
                  <span className="grid size-7 place-items-center rounded-full bg-secondary">
                    <Plus className="size-3.5" strokeWidth={2} />
                  </span>
                </div>
              </div>
              <div className="grid gap-2 pt-1">
                <span className="hero-yes grid h-11 place-items-center rounded-full bg-wine text-sm font-medium text-bone">{t.phone.yes}</span>
                <span className="grid h-11 place-items-center rounded-full border border-foreground/20 text-sm font-medium">{t.phone.no}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Host's live counter */}
      <div className="hero-float-a absolute top-[12%] -left-2 w-40 rounded-xl border border-border bg-lift p-4 shadow-float sm:-left-10 md:w-44 lg:-left-6 xl:-left-14">
        <span className="text-xs text-muted-foreground">{t.counter.label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[2.5rem] leading-tight tabular">{count}</span>
          <span className="text-xs text-muted-foreground">{t.counter.unit}</span>
        </div>
        <span className="text-[0.6875rem] text-muted-foreground">{t.counter.of}</span>
      </div>

      {/* Answers arriving */}
      <div className="hero-float-b absolute -right-2 bottom-[14%] w-52 sm:-right-10 lg:-right-4 xl:-right-12">
        {t.toast.map((item, i) => (
          <div
            key={item.name}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border bg-lift px-4 py-3 shadow-float transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
              i === 0 ? "relative" : "absolute inset-x-0 top-0",
              i === toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <span className={cn("size-2 shrink-0 rounded-full", item.coming ? "bg-wine" : "bg-foreground/30")} />
            <span className="grid min-w-0">
              <span className="truncate text-sm font-medium">{item.name}</span>
              <span className="truncate text-xs text-muted-foreground">{item.detail}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FakeInput({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-[0.6875rem] font-medium">{label}</span>
      <span className="flex h-10 items-center rounded-[10px] border border-input bg-card px-3 text-sm">{value}</span>
    </div>
  );
}
