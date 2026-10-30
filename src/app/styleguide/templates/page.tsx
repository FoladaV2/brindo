import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarPlus, MapPin } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button } from "@/templates/ui/Button";
import { Divider } from "@/templates/ui/Divider";
import { Grain } from "@/templates/ui/Grain";
import { Halo } from "@/templates/ui/Halo";
import { Label } from "@/templates/ui/Label";
import { LightSweep } from "@/templates/ui/LightSweep";
import { Reveal } from "@/templates/ui/Reveal";
import { SectionHeader } from "@/templates/ui/SectionHeader";
import { TextUnveil } from "@/templates/ui/TextUnveil";
import { Wordmark } from "@/components/brand/Wordmark";
import { FieldSpecimens, StepperSpecimen } from "./client-specimens";
import { contrast, parseBlocks, resolver } from "../../../../scripts/contrast.mjs";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false, nocache: true },
};

const t = copy.styleguide;

type Surface = "light" | "dark";
const SURFACE_SELECTOR = { light: '[data-surface="light"]', dark: '[data-surface="dark"]' } as const;

const PALETTE = ["ivory", "paper", "ink", "graphite", "champagne", "champagne-deep", "rose-glow", "stone", "stone-dark"];
const SEMANTIC = ["bg", "raised", "fg", "fg-muted", "gilt", "gilt-fg", "hairline", "control-line", "focus", "error"];
const SPACING = [8, 16, 24, 32, 48, 64, 96, 128];
const DURATIONS = [
  ["micro", "200ms", "press, hover, small state changes"],
  ["reveal", "800ms", "scroll reveal, fade-up 24px"],
  ["unveil", "1100ms", "hero names, 120ms line stagger"],
  ["halo", "1600ms", "halo fade-in"],
  ["sweep", "1800ms", "single light sweep, starts at 400ms"],
  ["drift", "18s", "ambient halo drift, linear"],
];

function loadTokens() {
  const css = readFileSync(path.join(process.cwd(), "src/styles/template-tokens.css"), "utf8");
  const blocks = parseBlocks(css);
  return {
    light: resolver(blocks, SURFACE_SELECTOR.light),
    dark: resolver(blocks, SURFACE_SELECTOR.dark),
  };
}

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production" && process.env.STYLEGUIDE_ENABLED !== "true") notFound();
  const tokens = loadTokens();

  return (
    <main>
      <nav className="sticky top-0 z-10 border-b border-hairline bg-bg" data-surface="light">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-gutter">
          <Wordmark height={22} />
          <div className="flex gap-6">
            <a href="#light" className="label label-latin text-fg">
              Light
            </a>
            <a href="#dark" className="label label-latin text-fg">
              Dark
            </a>
          </div>
        </div>
      </nav>
      <SurfaceSection surface="light" resolve={tokens.light} />
      <SurfaceSection surface="dark" resolve={tokens.dark} />
    </main>
  );
}

function SurfaceSection({ surface, resolve }: { surface: Surface; resolve: (name: string) => string }) {
  return (
    <div id={surface} data-surface={surface} data-testid={`surface-${surface}`} className="relative isolate scroll-mt-16">
      <Grain />
      <Hero surface={surface} />
      <Container>
        <Block title="Color">
          <Swatches names={PALETTE} resolve={resolve} />
          <div className="mt-12">
            <Label>Semantic (remapped by data-surface)</Label>
            <Swatches names={SEMANTIC} resolve={resolve} className="mt-6" contrastAgainst="--bg" />
          </div>
        </Block>

        <Block title="Typography">
          <Typography />
        </Block>

        <Block title="Space, shape, motion">
          <SpaceShapeMotion />
        </Block>

        <Block title="Components">
          <Components surface={surface} />
        </Block>
      </Container>
    </div>
  );
}

function Hero({ surface }: { surface: Surface }) {
  return (
    <header className="relative overflow-clip">
      {/* One ambient animation at a time: only the first hero drifts. */}
      <Halo drift={surface === "light"} />
      <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-gutter py-section text-center">
        <Label>{`Brindo design system · ${surface} surface`}</Label>
        {/* Noir sets names in flat champagne; Lumière in ink */}
        <h1 className={`mt-12 font-display text-display ${surface === "dark" ? "text-gilt" : ""}`}>
          <LightSweep delay={500}>
            <TextUnveil
              as="span"
              lines={[
                t.namesShort[0],
                <span key="amp" className="block py-2 text-h3 leading-none text-gilt-fg">
                  {t.ampersand}
                </span>,
                t.namesShort[1],
              ]}
            />
          </LightSweep>
        </h1>
        <Divider className="mt-12 w-40" />
        <p className="mt-8 font-display text-h3 tabular-nums">
          {t.day} {t.month} {t.year}
        </p>
      </div>
    </header>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1200px] px-gutter pb-section">{children}</div>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hairline pt-12 pb-24 md:grid md:grid-cols-[200px_1fr] md:gap-12">
      <h2 className="label label-latin mb-10 md:mb-0">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Swatches({
  names,
  resolve,
  className,
  contrastAgainst,
}: {
  names: string[];
  resolve: (name: string) => string;
  className?: string;
  contrastAgainst?: string;
}) {
  return (
    <ul className={`grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 ${className ?? ""}`}>
      {names.map((name) => {
        const value = resolve(`--${name}`);
        const ratio = contrastAgainst && name !== "bg" ? contrast(value, resolve(contrastAgainst)) : null;
        return (
          <li key={name} className="min-w-0">
            <div className="aspect-[4/3] rounded-card border border-hairline" style={{ background: `var(--${name})` }} />
            <p className="mt-3 text-small font-medium">--{name}</p>
            <p className="text-small text-fg-muted tabular-nums">
              {value}
              {ratio && <span className="block">{ratio.toFixed(2)}:1 on bg</span>}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Typography() {
  return (
    <div className="flex flex-col gap-16">
      <Specimen name="Display · 56–120px · TBC Contractica CAPS 400">
        <p className="font-display text-display">
          {t.namesLong[0]}
          <br />
          <span className="text-h3 text-gilt-fg">{t.ampersand}</span>
          <br />
          {t.namesLong[1]}
        </p>
      </Specimen>
      <Specimen name="H2 · 32–56px">
        <p className="font-display text-h2">{t.headings.h2}</p>
      </Specimen>
      <Specimen name="H3 · 22–28px">
        <p className="font-display text-h3">{t.headings.h3}</p>
      </Specimen>
      <Specimen name="Body · 17–18px / 1.65 · TBC Contractica CAPS">
        <p className="max-w-measure text-body whitespace-pre-line">{t.message}</p>
        <p className="mt-6 max-w-measure text-body text-fg-muted">{t.address}</p>
      </Specimen>
      <Specimen name="Label · 11–12px, tracking 0.22em, never uppercased in Georgian">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {Object.values(t.labels).map((l) => (
            <Label key={l}>{l}</Label>
          ))}
          <Label>Latin label</Label>
        </div>
      </Specimen>
      <Specimen name="Numerals · tabular">
        <div className="flex flex-wrap items-end gap-x-16 gap-y-10">
          <div className="flex flex-col items-center">
            <Label>{t.weekday}</Label>
            <span className="font-display text-display tabular-nums">{t.day}</span>
            <Label>{`${t.month} · ${t.year}`}</Label>
          </div>
          <dl className="grid grid-cols-4 gap-x-6 text-center sm:gap-x-10">
            {["128", "06", "42", "19"].map((n, i) => (
              <div key={i} className="flex flex-col-reverse items-center gap-1">
                <dt className="label">{t.countdownUnits[i]}</dt>
                <dd className="font-display text-h2 tabular-nums">{n}</dd>
              </div>
            ))}
          </dl>
          <span className="font-display text-h3 tabular-nums">{t.time}</span>
        </div>
      </Specimen>
    </div>
  );
}

function SpaceShapeMotion() {
  return (
    <div className="grid gap-16 lg:grid-cols-2">
      <Specimen name="Spacing · 8px grid">
        <ul className="flex flex-col gap-3">
          {SPACING.map((s) => (
            <li key={s} className="flex items-center gap-4">
              <span className="w-10 text-small text-fg-muted tabular-nums">{s}</span>
              <span className="h-2 bg-gilt" style={{ width: s * 2 }} />
            </li>
          ))}
          <li className="pt-2 text-small text-fg-muted">Section rhythm: 96–200px, gutter: 24–64px</li>
        </ul>
      </Specimen>
      <Specimen name="Radius · 2px or pill, nothing between">
        <div className="flex items-center gap-6">
          <div className="grid h-24 w-32 place-items-end rounded-card border border-hairline bg-raised p-3">
            <span className="text-small text-fg-muted">2px</span>
          </div>
          <div className="grid h-12 w-32 place-items-center rounded-pill border border-control">
            <span className="text-small text-fg-muted">pill</span>
          </div>
        </div>
      </Specimen>
      <Specimen name="Easing · cubic-bezier(0.22, 1, 0.36, 1)">
        <svg viewBox="-4 -4 108 108" className="h-36 w-36" aria-hidden>
          <rect x="0" y="0" width="100" height="100" fill="none" stroke="var(--hairline)" strokeWidth="0.6" />
          <path d="M0 100 C22 0 36 0 100 0" fill="none" stroke="var(--gilt)" strokeWidth="1.25" />
        </svg>
      </Specimen>
      <Specimen name="Durations">
        <dl className="grid grid-cols-[auto_auto_1fr] gap-x-6 gap-y-2 text-small">
          {DURATIONS.map(([name, value, use]) => (
            <div key={name} className="contents">
              <dt className="font-medium">{name}</dt>
              <dd className="text-gilt-fg tabular-nums">{value}</dd>
              <dd className="text-fg-muted">{use}</dd>
            </div>
          ))}
        </dl>
      </Specimen>
    </div>
  );
}

function Components({ surface }: { surface: Surface }) {
  return (
    <div className="flex flex-col gap-20">
      <Specimen name="Wordmark · monogram">
        <div className="flex flex-wrap items-end gap-x-12 gap-y-8">
          <Wordmark height={64} tone={surface} />
          <Wordmark height={28} tone={surface} />
          <Wordmark height={64} tone={surface} monogram />
          <div className="rounded-card bg-raised p-6">
            <Wordmark height={28} tone={surface} />
          </div>
        </div>
      </Specimen>

      <Specimen name="Button · primary, secondary, loading, disabled">
        <div className="flex flex-wrap gap-4">
          <Button>{t.buttons.accept}</Button>
          <Button variant="secondary">{t.buttons.decline}</Button>
          <Button variant="secondary">
            <CalendarPlus size={18} strokeWidth={1.25} aria-hidden />
            {t.buttons.calendar}
          </Button>
          <Button variant="secondary">
            <MapPin size={18} strokeWidth={1.25} aria-hidden />
            {t.buttons.maps}
          </Button>
          <Button loading>{t.buttons.accept}</Button>
          <Button disabled>{t.buttons.accept}</Button>
        </div>
      </Specimen>

      <Specimen name="Input · Textarea · empty, filled, error">
        <FieldSpecimens />
      </Specimen>

      <Specimen name="Stepper · 48px targets">
        <StepperSpecimen />
      </Specimen>

      <Specimen name="Divider · ring, diamond">
        <div className="flex flex-col gap-10">
          <Divider />
          <Divider ornament="diamond" className="mx-auto w-48" />
        </div>
      </Specimen>

      <Specimen name="SectionHeader · center, start">
        <div className="flex flex-col gap-16">
          <SectionHeader label={t.labels.venue} title={t.venueName} as="h3" />
          <SectionHeader label={t.labels.program} title={t.headings.h3} as="h3" align="start" />
        </div>
      </Specimen>

      <Specimen name="Halo · Grain (surface, champagne, rose)">
        <div className="grid gap-6 md:grid-cols-3">
          {(["surface", "champagne", "rose"] as const).map((tone) => (
            <div key={tone} className="relative isolate overflow-clip rounded-card border border-hairline bg-raised px-8 pt-20 pb-12 text-center">
              <Halo tone={tone} />
              <Grain />
              <p className="relative font-display text-h3">{t.halo}</p>
              <p className="label label-latin relative mt-6">{tone}</p>
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen name="Reveal · fade-up on scroll, once, 90ms stagger">
        <div className="grid gap-6 md:grid-cols-3">
          {[t.labels.date, t.labels.venue, t.labels.rsvp].map((l, i) => (
            <Reveal key={l} delay={i * 90} className="rounded-card border border-hairline bg-raised p-8">
              <Label>{l}</Label>
              <p className="mt-4 text-body">{t.address}</p>
            </Reveal>
          ))}
        </div>
      </Specimen>
    </div>
  );
}

function Specimen({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-6 text-small text-fg-muted">{name}</figcaption>
      {children}
    </figure>
  );
}
