"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight, Link2, Share2, Users } from "lucide-react";
import { copy } from "@content/copy.ka";
import { LogoMark } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { play } from "@/lib/sound";
import { fill } from "@/lib/text";
import { cn } from "@/lib/utils";
import { CopyLinkButton } from "../../../copy-link-button";

const p = copy.payment.done.published;

const canShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
const noop = () => () => {};

/**
 * The invitation is live. The link, one tap to copy it, and one tap to send it where Georgian
 * guests are: WhatsApp and Viber (universal links that open the app), or the phone's share sheet.
 */
export function Published({ url, slug, title, responsesHref }: { url: string; slug: string; title: string; responsesHref: string }) {
  const message = fill(p.shareText, { title, url });
  const share = useSyncExternalStore(noop, canShare, () => false);

  // The clink, once per invitation in this tab (a reload doesn't replay it). After returning from
  // the payment page the browser may not allow sound yet; then it simply stays quiet.
  useEffect(() => {
    const key = `brindo:clinked:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: play anyway.
    }
    play("clink");
  }, [slug]);

  return (
    <div className="grid justify-items-center gap-8 text-center">
      <div className="grid justify-items-center gap-5 animate-in fade-in-0 slide-in-from-bottom-2 transition-none duration-700 motion-reduce:animate-none">
        <LogoMark size={48} />
        <span className="eyebrow">{p.label}</span>
        <h1 className="font-display text-title">{p.heading}</h1>
        <p className="max-w-md text-lead text-muted-foreground">{p.body}</p>
      </div>

      <div className="grid w-full gap-4 rounded-2xl border border-border bg-card p-5 text-left animate-in fade-in-0 slide-in-from-bottom-2 transition-none delay-150 duration-700 fill-mode-both sm:p-7 motion-reduce:animate-none">
        <span className="text-sm text-muted-foreground">{p.link}</span>
        <p className="flex min-h-13 items-center gap-2 rounded-md border border-border bg-background px-4 text-[0.9375rem]">
          <Link2 className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
          <span className="min-w-0 truncate">{url.replace(/^https?:\/\//, "")}</span>
        </p>
        <CopyLinkButton
          url={url}
          label={p.copy}
          copiedLabel={p.copied}
          toast={{ title: copy.toasts.linkCopied, description: copy.toasts.linkCopiedHint }}
          variant="default"
          size="lg"
          className="w-full"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener" className={buttonVariants({ variant: "outline" })}>
            WhatsApp
          </a>
          <a href={`viber://forward?text=${encodeURIComponent(message)}`} className={buttonVariants({ variant: "outline" })}>
            Viber
          </a>
          {share ? (
            <Button
              variant="outline"
              className="col-span-2 sm:col-span-1"
              onClick={() => navigator.share({ title, text: message, url }).catch(() => {})}
            >
              <Share2 strokeWidth={1.75} /> {p.share}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Link href={responsesHref} className={buttonVariants({ variant: "secondary" })}>
          <Users strokeWidth={1.75} /> {p.responses}
        </Link>
        <a href={`/i/${slug}`} target="_blank" rel="noopener" className={cn(buttonVariants({ variant: "ghost" }))}>
          {p.open} <ArrowUpRight strokeWidth={1.75} />
        </a>
      </div>
    </div>
  );
}
