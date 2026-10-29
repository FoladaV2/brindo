"use client";

import { useState } from "react";
import { copy } from "@content/copy.ka";
import { Input, Textarea } from "@/templates/ui/Field";
import { Stepper } from "@/templates/ui/Stepper";

const t = copy.styleguide;

export function FieldSpecimens() {
  return (
    <div className="grid max-w-[640px] gap-x-10 gap-y-4 md:grid-cols-2">
      <Input label={t.fields.name} name="empty" autoComplete="off" />
      <Input label={t.fields.name} name="filled" defaultValue={t.fields.nameValue} autoComplete="off" />
      <Input label={t.fields.name} name="error" error={t.fields.nameError} autoComplete="off" />
      <div />
      <Textarea
        label={t.fields.message}
        name="message"
        hint={t.fields.messageHint}
        defaultValue={t.message}
        className="md:col-span-2"
      />
    </div>
  );
}

export function StepperSpecimen() {
  const [size, setSize] = useState(2);
  return <Stepper label={t.fields.partySize} buttonLabels={copy.ui} value={size} onChange={setSize} min={1} max={8} />;
}
