import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Link2, Plus } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonArrow } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FaqSpecimen, OverlaySpecimens, QuestionSpecimen, SelectSpecimen, TabsSpecimen, ToggleSpecimens } from "./specimens";
import { contrast, parseBlocks, resolver } from "../../../scripts/contrast.mjs";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false, nocache: true },
};

const t = copy.brandStyleguide;

const CORE = [
  { token: "bone", role: t.colors.roles.bone, className: "bg-bone text-onyx border border-line" },
  { token: "onyx", role: t.colors.roles.onyx, className: "bg-onyx text-bone" },
  { token: "wine", role: t.colors.roles.wine, className: "bg-wine text-bone" },
] as const;

/** Tints, each with the text colour it is checked against. */
const TINTS = [
  ["lift", "onyx"],
  ["sunken", "onyx"],
  ["line", "onyx"],
  ["wine-tint", "wine"],
  ["onyx-muted", "bone"],
  ["stroke", "bone"],
  ["wine-press", "bone"],
  ["bone-muted", "onyx"],
  ["bone-line", "bone"],
] as const;

const TYPE = [
  ["hero", "font-display text-hero", t.type.samples.hero],
  ["title", "font-display text-title", t.type.samples.title],
  ["heading", "font-display text-heading", t.type.samples.heading],
  ["lead", "text-lead text-muted-foreground", t.type.samples.lead],
  ["body", "text-base", t.type.samples.body],
  ["small", "text-sm text-muted-foreground", t.type.samples.small],
] as const;

function loadTokens() {
  const css = readFileSync(path.join(process.cwd(), "src/styles/brand.css"), "utf8");
  return resolver(parseBlocks(css), ":root");
}

function Section({ id, title, lead, children, className }: { id: string; title: string; lead?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-24 border-t border-border py-16 md:py-24", className)}>
      <div className="mb-10 grid gap-3 md:mb-14">
        <h2 id={`${id}-title`} className="font-display text-title">
          {title}
        </h2>
        {lead ? <p className="max-w-xl text-lead text-muted-foreground">{lead}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Specimen({ name, children, className }: { name: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4", className)}>
      <p className="tabular text-xs text-muted-foreground">{name}</p>
      {children}
    </div>
  );
}

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production" && process.env.STYLEGUIDE_ENABLED !== "true") notFound();
  const resolve = loadTokens();

  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-page items-center gap-8 px-gutter-brand">
          <Logo height={20} />
          <nav aria-label={t.title} className="-mx-2 flex min-w-0 flex-1 gap-1 overflow-x-auto px-2 [scrollbar-width:none] md:justify-end">
            {Object.entries(t.nav).map(([id, label]) => (
              <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-page px-gutter-brand">
        {/* Hero specimen */}
        <section className="relative isolate grid gap-8 py-20 md:py-32" data-testid="hero">
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[56rem] -translate-x-1/2 bg-(image:--glow-wine)" />
          <span className="eyebrow">{t.eyebrow}</span>
          <h1 className="max-w-4xl font-display text-hero">{t.hero}</h1>
          <p className="max-w-xl text-lead text-muted-foreground">{t.lead}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg">
              {t.primary}
              <ButtonArrow />
            </Button>
            <Button size="lg" variant="ghost">
              {t.secondary}
            </Button>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
            {t.trust.map((line) => (
              <li key={line} className="flex items-center gap-2">
                <Check className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <Section id="colors" title={t.colors.heading} lead={t.colors.lead}>
          <div className="grid gap-4 md:grid-cols-3">
            {CORE.map(({ token, role, className }) => (
              <div key={token} className={cn("flex aspect-[4/3] flex-col justify-between rounded-xl p-6 md:aspect-[3/4] md:p-8", className)}>
                <span className="font-display text-heading">{role}</span>
                <span className="grid gap-1">
                  <span className="tabular text-sm">--{token}</span>
                  <span className="tabular text-sm opacity-75">{resolve(`--${token}`).toUpperCase()}</span>
                </span>
              </div>
            ))}
          </div>
          <h3 className="mt-12 mb-5 text-sm font-medium text-muted-foreground">{t.colors.tints}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {TINTS.map(([token, on]) => {
              const bg = resolve(`--${token}`);
              const ratio = contrast(resolve(`--${on}`), bg);
              return (
                <div key={token} className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex h-20 items-end p-3 text-sm font-medium" style={{ background: bg, color: `var(--${on})` }}>
                    Aa
                  </div>
                  <div className="grid gap-0.5 p-3 tabular text-xs">
                    <span>--{token}</span>
                    <span className="text-muted-foreground">
                      {bg.toUpperCase()} · {ratio.toFixed(1)}:1
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="type" title={t.type.heading}>
          <div className="grid">
            {TYPE.map(([name, className, sample]) => (
              <div key={name} className="grid gap-2 border-b border-border py-6 last:border-b-0 md:grid-cols-[10rem_1fr] md:gap-8">
                <span className="tabular text-xs text-muted-foreground md:pt-2">{name}</span>
                <p className={cn("max-w-3xl", className)}>{sample}</p>
              </div>
            ))}
            <div className="grid gap-2 py-6 md:grid-cols-[10rem_1fr] md:gap-8">
              <span className="tabular text-xs text-muted-foreground">eyebrow</span>
              <span className="eyebrow">{t.eyebrow}</span>
            </div>
          </div>
        </Section>

        <Section id="buttons" title={t.buttons.heading}>
          <div className="grid gap-10">
            <Specimen name="variant">
              <div className="flex flex-wrap items-center gap-3">
                <Button>
                  <Plus strokeWidth={2} /> {t.buttons.primary}
                </Button>
                <Button variant="outline">{t.buttons.outline}</Button>
                <Button variant="secondary">
                  <Link2 strokeWidth={1.75} /> {t.buttons.secondary}
                </Button>
                <Button variant="ghost">{t.buttons.ghost}</Button>
                <Button variant="link">{t.buttons.link}</Button>
                <Button variant="destructive">{t.buttons.destructive}</Button>
                <Button disabled>{t.buttons.disabled}</Button>
              </div>
            </Specimen>
            <Specimen name="size">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">{t.buttons.sizes.sm}</Button>
                <Button>{t.buttons.sizes.default}</Button>
                <Button size="lg">
                  {t.buttons.sizes.lg} <ButtonArrow />
                </Button>
              </div>
            </Specimen>
          </div>
        </Section>

        <Section id="forms" title={t.forms.heading}>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="grid content-start gap-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field id="sg-first" label={t.forms.firstName}>
                  {(control) => <Input {...control} defaultValue={t.forms.firstNameValue} autoComplete="off" />}
                </Field>
                <Field id="sg-last" label={t.forms.lastName} error={t.forms.lastNameError}>
                  {(control) => <Input {...control} autoComplete="off" />}
                </Field>
              </div>
              <Field id="sg-title" label={t.forms.title} hint={t.forms.titleHint}>
                {(control) => <Input {...control} placeholder={t.forms.titlePlaceholder} autoComplete="off" />}
              </Field>
              <SelectSpecimen />
              <Field id="sg-message" label={t.forms.message} aside={t.forms.optional}>
                {(control) => <Textarea {...control} defaultValue={t.forms.messageValue} />}
              </Field>
              <ToggleSpecimens />
            </div>
            <Card className="py-8">
              <CardContent className="px-6 md:px-8">
                <QuestionSpecimen />
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section id="components" title={t.components.heading}>
          <div className="grid gap-12">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge>{t.components.badges.live}</Badge>
                    <Badge variant="secondary">{t.components.badges.draft}</Badge>
                    <Badge variant="outline">{t.components.badges.paid}</Badge>
                  </div>
                  <CardTitle>{t.components.card.title}</CardTitle>
                  <CardDescription>{t.components.card.meta}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                  <div className="grid gap-1">
                    <span className="font-display text-title tabular">186</span>
                    <span className="text-sm text-muted-foreground">
                      {t.components.card.people} {t.components.card.coming}
                    </span>
                  </div>
                  <div className="grid gap-1">
                    <span className="font-display text-title tabular">64</span>
                    <span className="text-sm text-muted-foreground">{t.components.card.replies}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="grid gap-8">
                  <TabsSpecimen />
                  <OverlaySpecimens />
                </CardContent>
              </Card>
            </div>
            <FaqSpecimen />
          </div>
        </Section>

        <section className="inverted -mx-gutter-brand my-8 grid gap-8 rounded-none px-gutter-brand py-16 md:mx-0 md:rounded-2xl md:p-16" aria-label={t.inverted.eyebrow}>
          <span className="eyebrow">{t.inverted.eyebrow}</span>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <span className="font-display text-hero tabular">{t.inverted.price}</span>
            <span className="pb-3 text-muted-foreground">{t.inverted.per}</span>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {t.trust.map((line) => (
              <li key={line} className="flex items-center gap-2 text-sm">
                <Check className="size-4" strokeWidth={2} aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          <div>
            <Button size="lg">
              {t.inverted.cta} <ButtonArrow />
            </Button>
          </div>
        </section>

        <Section id="logo" title={t.logo.heading} lead={t.logo.lead}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid aspect-[16/9] place-items-center rounded-xl border border-border bg-card">
              <Logo height={44} />
            </div>
            <div className="grid aspect-[16/9] place-items-center rounded-xl bg-onyx">
              <Logo height={44} tone="bone" />
            </div>
            <div className="flex flex-wrap items-end gap-6 rounded-xl border border-border p-6 md:col-span-2 md:gap-8 md:p-8">
              <LogoMark size={96} />
              <LogoMark size={48} />
              <LogoMark size={24} />
              <LogoMark size={16} />
              <div className="ml-auto grid size-24 place-items-center rounded-[22px] bg-wine">
                <LogoMark size={44} tone="bone" bubble="bone" />
              </div>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
