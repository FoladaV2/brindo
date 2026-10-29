import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "./site-footer";

type LegalContent = { title: string; sections: readonly { heading: string; body: string }[] };

/** Terms and Privacy: DRAFT text pending legal review, with the notice always visible. */
export function LegalPage({ content }: { content: LegalContent }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-gutter-brand">
        <div className="mx-auto flex h-20 max-w-page items-center">
          <Link href="/" aria-label={copy.home.nav.home} className="-m-2 rounded-full p-2">
            <Logo height={19} />
          </Link>
        </div>
      </header>
      <main className="flex-1 px-gutter-brand pt-12 pb-24 md:pt-20">
        <article className="mx-auto grid max-w-2xl gap-10">
          <Link href="/" className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
            {copy.legal.back}
          </Link>
          <h1 className="font-display text-title">{content.title}</h1>
          <p className="rounded-lg border border-primary/25 bg-selected px-5 py-4 text-sm text-primary">{copy.legal.draftNotice}</p>
          {content.sections.map((section) => (
            <section key={section.heading} className="grid gap-3">
              <h2 className="font-display text-heading">{section.heading}</h2>
              <p className="leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
