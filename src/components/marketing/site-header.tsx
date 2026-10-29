"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Logo } from "@/components/brand/logo";
import { Button, ButtonArrow } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const t = copy.home.nav;

/**
 * Transparent over the hero; once the page scrolls, a floating pill fades in behind it
 * (opacity and scale only, the bar itself never changes size). Phones get a menu sheet.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
      <div className="relative mx-auto flex h-14 max-w-page items-center justify-between gap-4 pr-2 pl-4 md:h-16 md:pr-3 md:pl-6">
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 -z-10 rounded-full border border-border bg-lift/85 shadow-float backdrop-blur-nav",
            "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
            scrolled ? "scale-100 opacity-100" : "scale-[0.985] opacity-0",
          )}
        />
        <Link href="/" aria-label={t.home} className="-m-2 rounded-full p-2">
          <Logo height={19} />
        </Link>

        <nav aria-label={t.label} className="hidden items-center gap-1 lg:flex">
          {t.links.map((link) => (
            <a key={link.href} href={link.href} className="rounded-full px-4 py-2 text-[0.9375rem] text-muted-foreground hover:bg-accent hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">{t.login}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">
              {t.cta}
              <ButtonArrow className="hidden sm:block" />
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label={t.menu}>
                <Menu className="size-5" strokeWidth={1.75} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="gap-0 p-0">
              <div className="flex h-16 items-center px-6">
                <SheetTitle className="sr-only">{t.menu}</SheetTitle>
                <Logo height={19} />
              </div>
              <nav aria-label={t.label} className="grid gap-1 px-3 py-4">
                {t.links.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <a href={link.href} className="rounded-lg px-3 py-3.5 font-display text-heading hover:bg-accent">
                      {link.label}
                    </a>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto grid gap-3 border-t border-border p-6">
                <Button asChild size="lg">
                  <Link href="/register">
                    {t.cta} <ButtonArrow />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">{t.login}</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
