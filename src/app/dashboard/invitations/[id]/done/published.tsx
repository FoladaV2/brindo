import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Label } from "@/templates/ui/Label";
import { LightSweep } from "@/templates/ui/LightSweep";
import { LinkText } from "@/components/legacy/LinkText";
import { CopyLinkButton } from "./copy-link";
import { Message, stagger } from "./message";

/** The invitation is live: its link, Copy link, Add guests. */
export function Published({ url, slug, guestsHref }: { url: string; slug: string; guestsHref: string }) {
  const p = copy.payment.done.published;
  return (
    <Message label={p.label} heading={<LightSweep delay={900}>{p.heading}</LightSweep>} body={p.body}>
      <div
        className="rise-in mt-12 flex w-full flex-col gap-6 rounded-card border border-hairline bg-raised p-6 text-start"
        style={stagger(3)}
      >
        <div className="flex flex-col gap-2">
          <Label>{p.link}</Label>
          <p className="font-medium text-fg">
            <LinkText url={url} />
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <CopyLinkButton url={url} label={p.copy} copiedLabel={p.copied} className="w-full" />
          <Link href={guestsHref} className="btn btn-secondary w-full">
            <span className="btn-label">{p.addGuests}</span>
          </Link>
        </div>
      </div>
      <a
        href={`/i/${slug}`}
        target="_blank"
        rel="noopener"
        className="rise-in mt-8 inline-flex min-h-tap items-center gap-2 text-ui hover:text-gilt-fg"
        style={stagger(4)}
      >
        {p.open}
        <ArrowUpRight size={16} strokeWidth={1.25} aria-hidden />
      </a>
    </Message>
  );
}
