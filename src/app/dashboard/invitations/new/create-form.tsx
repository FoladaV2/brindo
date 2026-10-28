"use client";

import { useActionState, useState } from "react";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { LIMITS } from "@/lib/invitations/schema";
import { createInvitation, type CreateState } from "../actions";

const t = copy.create;

export function CreateForm() {
  const [state, action, pending] = useActionState<CreateState, FormData>(createInvitation, {});
  const [values, setValues] = useState({ partnerA: "", partnerB: "" });

  const errorFor = (field: "partnerA" | "partnerB") =>
    state.fields?.[field] ? (values[field].trim() ? copy.editor.errors.name : copy.editor.errors.required) : undefined;

  return (
    <form action={action} className="mt-12 flex flex-col gap-2" noValidate>
      {(["partnerA", "partnerB"] as const).map((field) => (
        <Input
          key={field}
          name={field}
          label={t[field]}
          hint={copy.editor.fields.namesHint}
          error={errorFor(field)}
          maxLength={LIMITS.name}
          autoComplete="off"
          value={values[field]}
          onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
          required
        />
      ))}
      {state.error && (
        <p role="alert" className="text-small text-error">
          {state.error}
        </p>
      )}
      <Button type="submit" loading={pending} className="mt-8 self-start">
        {t.submit}
      </Button>
    </form>
  );
}
