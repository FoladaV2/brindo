import Image from "next/image";
import { Check, Copy, Link2 } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Reveal } from "@/templates/ui/Reveal";
import { Section, SectionHeading } from "./section";

const t = copy.home.how;
const v = t.visual;

/** Three steps, each with a small drawing of the real screen it describes. */
export function HowItWorks() {
  const visuals = [<EditorVisual key="editor" />, <ShareVisual key="share" />, <ResponsesVisual key="responses" />];
  return (
    <Section id="how" labelledBy="how-title">
      <SectionHeading id="how-title" eyebrow={t.eyebrow} title={t.heading} />
      <ol className="mt-14 grid gap-5 md:mt-20 lg:grid-cols-3 lg:gap-6">
        {t.steps.map((step, i) => (
          <Reveal as="li" key={step.title} delay={i * 90} className="flex flex-col overflow-hidden rounded-xl border border-border bg-lift">
            <div aria-hidden="true" className="relative grid aspect-[5/4] place-items-center overflow-hidden border-b border-border bg-sunken/60 p-6">
              {visuals[i]}
            </div>
            <div className="grid gap-3 p-7 md:p-8">
              <span className="font-display text-sm text-primary tabular">0{i + 1}</span>
              <h3 className="font-display text-heading">{step.title}</h3>
              <p className="text-muted-foreground">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

function EditorVisual() {
  return (
    <div className="grid w-full max-w-[17rem] gap-3 rounded-lg border border-border bg-lift p-4 shadow-float">
      <MiniField label={v.editor.title} value={v.editor.titleValue} focused />
      <MiniField label={v.editor.date} value={v.editor.dateValue} />
      <div className="grid gap-1.5">
        <span className="text-[0.6875rem] font-medium">{v.editor.design}</span>
        <div className="flex gap-2">
          {(["lumiere", "noir"] as const).map((id, i) => (
            <span key={id} className={i === 0 ? "rounded-[9px] p-0.5 ring-2 ring-primary" : "rounded-[9px] p-0.5"}>
              <Image src={`/templates/${id}.webp`} alt="" width={44} height={66} className="block rounded-[7px]" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniField({ label, value, focused = false }: { label: string; value: string; focused?: boolean }) {
  return (
    <div className="grid gap-1">
      <span className="text-[0.6875rem] font-medium">{label}</span>
      <span
        className={
          focused
            ? "flex h-9 items-center rounded-[9px] border border-primary bg-card px-3 text-sm ring-[3px] ring-primary/15"
            : "flex h-9 items-center rounded-[9px] border border-input bg-card px-3 text-sm"
        }
      >
        {value}
        {focused ? <span className="ml-0.5 h-4 w-px animate-pulse bg-foreground" /> : null}
      </span>
    </div>
  );
}

function ShareVisual() {
  return (
    <div className="grid w-full max-w-[17rem] gap-3">
      <div className="flex items-center gap-2 rounded-full border border-border bg-lift py-1.5 pr-1.5 pl-3 shadow-float">
        <Link2 className="size-4 shrink-0 text-primary" strokeWidth={1.75} />
        <span className="min-w-0 flex-1 truncate text-xs">{v.share.link}</span>
        <span className="grid size-7 place-items-center rounded-full bg-wine text-bone">
          <Copy className="size-3.5" strokeWidth={1.75} />
        </span>
      </div>
      <div className="grid gap-2 rounded-lg border border-border bg-lift p-3">
        <div className="ml-auto grid max-w-[85%] gap-1.5 rounded-2xl rounded-br-md bg-onyx p-2 text-bone">
          <span className="grid gap-0.5 rounded-xl bg-bone-line px-3 py-2">
            <span className="font-display text-sm leading-tight">{v.editor.titleValue}</span>
            <span className="text-[0.625rem] text-bone-muted">{v.share.link}</span>
          </span>
          <span className="px-1 text-xs">{v.share.message}</span>
        </div>
        <span className="mr-auto max-w-[80%] rounded-2xl rounded-bl-md bg-sunken px-3 py-2 text-xs">{v.share.reply}</span>
      </div>
    </div>
  );
}

function ResponsesVisual() {
  return (
    <div className="grid w-full max-w-[17rem] gap-3 rounded-lg border border-border bg-lift p-4 shadow-float">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{v.dashboard.total}</span>
        <span className="flex items-baseline gap-1">
          <span className="font-display text-3xl leading-none tabular">186</span>
          <span className="text-[0.6875rem] text-muted-foreground">{v.dashboard.people}</span>
        </span>
      </div>
      <div className="h-px bg-border" />
      <ul className="grid gap-2">
        {v.dashboard.rows.map(([name, count]) => (
          <li key={name} className="flex items-center gap-2.5 text-sm">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-selected text-primary">
              <Check className="size-3" strokeWidth={2.5} />
            </span>
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="text-muted-foreground tabular">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
