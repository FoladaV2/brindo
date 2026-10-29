"use client";

import { useActionState, useState } from "react";
import { copy } from "@content/copy.ka";
import { Choice, ChoiceGroup } from "@/components/ui/choice";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { EVENT_TYPES, isCoupleEvent, type EventType } from "@/lib/events";
import { LIMITS } from "@/lib/invitations/schema";
import { createInvitation, type CreateState } from "../actions";

const t = copy.create;

/** Event type, then the two names (wedding, engagement) or one title (everything else). */
export function CreateForm({ initialType }: { initialType: EventType | null }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(createInvitation, {});
  const [eventType, setEventType] = useState<EventType | null>(initialType);
  const values = state.values;
  const couple = eventType !== null && isCoupleEvent(eventType);

  return (
    <form action={action} className="grid gap-10" noValidate>
      <fieldset className="grid gap-4">
        <legend className="mb-4 text-sm font-medium">{t.eventType}</legend>
        <input type="hidden" name="eventType" value={eventType ?? ""} />
        <ChoiceGroup
          value={eventType ?? ""}
          onValueChange={(value) => setEventType(value as EventType)}
          aria-label={t.eventType}
          className="grid-cols-1 sm:grid-cols-2"
        >
          {EVENT_TYPES.map((type) => (
            <Choice key={type} value={type} label={copy.events.types[type]} />
          ))}
        </ChoiceGroup>
      </fieldset>

      {eventType ? (
        <div key={couple ? "couple" : "title"} className="grid gap-5 animate-in fade-in-0 slide-in-from-bottom-1 transition-none duration-300 motion-reduce:animate-none">
          {couple ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {(["partnerA", "partnerB"] as const).map((field) => (
                <Field key={field} id={field} label={t[field]} error={state.fields?.[field]}>
                  {(control) => <Input {...control} name={field} maxLength={LIMITS.name} autoComplete="off" defaultValue={values?.[field]} required />}
                </Field>
              ))}
            </div>
          ) : (
            <Field id="title" label={t.titleLabel} hint={t.titleHint} error={state.fields?.title}>
              {(control) => (
                <Input
                  {...control}
                  name="title"
                  maxLength={LIMITS.title}
                  autoComplete="off"
                  placeholder={copy.events.titlePlaceholders[eventType]}
                  defaultValue={values?.title}
                  required
                />
              )}
            </Field>
          )}
          <FormError message={state.error} />
          <SubmitButton pending={pending} size="lg" className="w-full sm:w-auto sm:justify-self-start">
            {t.submit}
          </SubmitButton>
        </div>
      ) : null}
    </form>
  );
}
