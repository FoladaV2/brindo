"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button, ButtonArrow } from "@/components/ui/button";
import { Choice, ChoiceGroup } from "@/components/ui/choice";
import { FormError } from "@/components/ui/form-error";
import { Progress } from "@/components/ui/progress";
import { QUESTIONS, type OnboardingAnswers, type QuestionId } from "@/lib/onboarding/questions";
import { fill } from "@/lib/text";
import { saveOnboarding } from "./actions";

const t = copy.onboarding;
const TOTAL = QUESTIONS.length;
/** Long enough to see the choice land, short enough to feel instant. */
const ADVANCE_MS = 260;

type Phase = "intro" | number | "done";

/**
 * Ten questions, one per screen. Tapping an answer moves on by itself; keyboard users choose with
 * the arrow keys and continue with the button (arrow keys select in a radio group, so they must
 * not advance). Every question can be skipped, and so can the whole flow.
 */
export function OnboardingFlow({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [error, setError] = useState(false);
  const [saving, startSaving] = useTransition();
  const advanceTimer = useRef<number | undefined>(undefined);

  const index = typeof phase === "number" ? phase : -1;
  const question = index >= 0 ? QUESTIONS[index] : null;

  function finish(final: OnboardingAnswers, skipped: boolean) {
    setError(false);
    startSaving(async () => {
      // The preview (/preview/onboarding) walks through the flow without saving anything.
      const result = demo ? { ok: true } : await saveOnboarding({ answers: final, skipped });
      if (!result.ok) return setError(true);
      if (skipped && !demo) router.push("/dashboard");
      else setPhase("done");
    });
  }

  function next(from: number, current = answers) {
    window.clearTimeout(advanceTimer.current);
    if (from + 1 < TOTAL) setPhase(from + 1);
    else finish(current, false);
  }

  function choose(id: QuestionId, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function chooseByPointer(id: QuestionId, value: string) {
    const updated = { ...answers, [id]: value } as OnboardingAnswers;
    setAnswers(updated);
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => next(index, updated), ADVANCE_MS);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-gutter-brand">
        <div className="mx-auto flex h-20 max-w-3xl items-center justify-between gap-4">
          <Logo height={19} />
          {phase !== "done" ? (
            <Button variant="ghost" size="sm" onClick={() => finish(answers, true)} disabled={saving}>
              {t.skipAll}
            </Button>
          ) : null}
        </div>
        {question ? (
          <div className="mx-auto grid max-w-3xl gap-2">
            <Progress value={((index + 1) / TOTAL) * 100} aria-label={fill(t.step, { n: index + 1, total: TOTAL })} />
          </div>
        ) : null}
      </header>

      <main className="flex flex-1 justify-center px-gutter-brand pt-10 pb-16 md:pt-16">
        <div key={String(phase)} className="w-full max-w-xl animate-in fade-in-0 slide-in-from-bottom-2 transition-none duration-500 motion-reduce:animate-none">
          {phase === "intro" ? (
            <section className="grid justify-items-start gap-6 pt-6 md:pt-12">
              <span className="eyebrow">{t.intro.eyebrow}</span>
              <h1 className="font-display text-title">{t.intro.heading}</h1>
              <p className="text-lead text-muted-foreground">{t.intro.body}</p>
              <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row">
                <Button size="lg" onClick={() => setPhase(0)}>
                  {t.intro.start} <ButtonArrow />
                </Button>
                <Button size="lg" variant="ghost" onClick={() => finish({}, true)} disabled={saving}>
                  {t.intro.skip}
                </Button>
              </div>
              <FormError message={error ? t.failed : null} />
            </section>
          ) : null}

          {question ? (
            <section aria-labelledby="question-title" className="grid gap-8">
              <div className="grid gap-3">
                <span className="text-sm text-muted-foreground tabular">{fill(t.step, { n: index + 1, total: TOTAL })}</span>
                <h1 id="question-title" className="font-display text-title">
                  {t.questions[question.id].title}
                </h1>
              </div>
              <ChoiceGroup
                aria-labelledby="question-title"
                value={answers[question.id] ?? ""}
                onValueChange={(value) => choose(question.id, value)}
              >
                {question.options.map((option) => (
                  <Choice
                    key={option}
                    value={option}
                    label={(t.questions[question.id].options as Record<string, string>)[option]}
                    onPointerUp={() => chooseByPointer(question.id, option)}
                  />
                ))}
              </ChoiceGroup>
              <FormError message={error ? t.failed : null} />
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setPhase(index === 0 ? "intro" : index - 1)}
                  disabled={saving}
                  aria-label={t.back}
                  className="max-sm:size-12 max-sm:px-0"
                >
                  <ArrowLeft strokeWidth={1.75} />
                  <span className="max-sm:hidden">{t.back}</span>
                </Button>
                <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                  {answers[question.id] ? null : (
                    <Button variant="ghost" onClick={() => next(index)} disabled={saving}>
                      {t.skipQuestion}
                    </Button>
                  )}
                  <Button onClick={() => next(index)} disabled={saving || !answers[question.id]}>
                    {saving ? t.saving : t.next}
                    {saving ? null : <ButtonArrow />}
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {phase === "done" ? (
            <section className="grid justify-items-start gap-6 pt-6 md:pt-12">
              <LogoMark size={40} />
              <span className="eyebrow">{t.done.eyebrow}</span>
              <h1 className="font-display text-title">{t.done.heading}</h1>
              <p className="text-lead text-muted-foreground">{t.done.body}</p>
              <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row">
                <Button asChild size="lg">
                  <Link href={`/dashboard/invitations/new${answers.eventType ? `?type=${answers.eventType}` : ""}`}>
                    {t.done.cta} <ButtonArrow />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/dashboard">{t.done.later}</Link>
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
