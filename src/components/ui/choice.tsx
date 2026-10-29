"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/** Large tappable answer cards (onboarding questions, event type). A radio group underneath. */
function ChoiceGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="choice-group" className={cn("grid gap-3", className)} {...props} />;
}

type ChoiceProps = React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  label: React.ReactNode;
  hint?: React.ReactNode;
};

function Choice({ className, label, hint, ...props }: ChoiceProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="choice"
      className={cn(
        "group/choice relative flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4 text-left",
        "transition-transform duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none",
        "hover:border-foreground/30 data-[state=checked]:border-primary data-[state=checked]:bg-selected",
        "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="grid gap-0.5">
        <span className="text-base leading-snug font-medium text-foreground">{label}</span>
        {hint ? <span className="text-sm text-muted-foreground">{hint}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className="grid size-6 shrink-0 place-items-center rounded-full border border-input bg-card group-data-[state=checked]/choice:border-primary group-data-[state=checked]/choice:bg-primary"
      >
        <svg viewBox="0 0 12 12" className="size-3 scale-50 opacity-0 transition-[transform,opacity] duration-200 ease-out group-data-[state=checked]/choice:scale-100 group-data-[state=checked]/choice:opacity-100 motion-reduce:transition-none">
          <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="var(--primary-foreground)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </RadioGroupPrimitive.Item>
  );
}

export { ChoiceGroup, Choice };
