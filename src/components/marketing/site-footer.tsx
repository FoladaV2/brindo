import Link from "next/link";
import { cacheLife } from "next/cache";
import { copy } from "@content/copy.ka";
import { Logo } from "@/components/brand/logo";
import { fill } from "@/lib/text";

const t = copy.home.footer;
const nav = copy.home.nav;

/** The year for the copyright line: cached for a day, so pages stay prerendered. */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/** Anchor links point at home page sections, so they work from the legal pages too. */
export async function SiteFooter() {
  const year = await currentYear();
  const columns = [
    { title: t.product, links: nav.links.map((l) => ({ href: `/${l.href}`, label: l.label })) },
    {
      title: t.account,
      links: [
        { href: "/register", label: t.register },
        { href: "/login", label: nav.login },
      ],
    },
    {
      title: t.company,
      links: [
        { href: "/terms", label: t.terms },
        { href: "/privacy", label: t.privacy },
      ],
    },
  ];

  return (
    <footer className="inverted px-gutter-brand pt-20 pb-10 md:pt-24">
      <div className="mx-auto grid max-w-page gap-16">
        <div className="grid gap-12 md:grid-cols-[1.2fr_2fr]">
          <div className="grid content-start gap-4">
            <Link href="/" aria-label={nav.home} className="-m-2 w-fit rounded-full p-2">
              <Logo height={22} tone="bone" />
            </Link>
            <p className="max-w-xs text-muted-foreground">{t.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title} className="grid content-start gap-4">
                <h2 className="text-sm text-muted-foreground">{col.title}</h2>
                <ul className="grid gap-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="rounded-sm hover:underline hover:decoration-bone-muted hover:underline-offset-4">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span className="tabular">{fill(t.rights, { year: String(year) })}</span>
          <span>{t.made}</span>
        </div>
      </div>
    </footer>
  );
}
