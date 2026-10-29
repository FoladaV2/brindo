"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Toaster } from "@/components/ui/sonner";
import { fill } from "@/lib/text";
import { grantUnlimited, revokeUnlimited, type GrantState } from "./actions";

const t = copy.admin.unlimited;

type Entitlement = { userId: string; email: string; note: string | null; grantedAt: string };

/** Who may publish without paying: grant by email, revoke from the list. */
export function UnlimitedAccess({ entitlements }: { entitlements: Entitlement[] }) {
  const [state, action, pending] = useActionState<GrantState, FormData>(grantUnlimited, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [revoking, startRevoke] = useTransition();

  useEffect(() => {
    if (state.ok) {
      toast.success(t.granted);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="grid gap-6">
      <form ref={formRef} action={action} noValidate className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
        <Field id="grant-email" label={t.email}>
          {(control) => <Input {...control} name="email" type="email" inputMode="email" autoComplete="off" required />}
        </Field>
        <Field id="grant-note" label={t.note}>
          {(control) => <Input {...control} name="note" maxLength={200} placeholder={t.notePlaceholder} autoComplete="off" />}
        </Field>
        <SubmitButton pending={pending} className="sm:mt-6.5">
          {t.grant}
        </SubmitButton>
        <div className="sm:col-span-3">
          <FormError message={state.error} />
        </div>
      </form>

      {entitlements.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {entitlements.map((e) => (
            <li key={e.userId} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 pr-2 pl-5">
              <span className="grid min-w-0 flex-1">
                <span className="truncate font-medium">{e.email}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {[e.note, fill(t.since, { date: e.grantedAt.slice(0, 10) })].filter(Boolean).join(" · ")}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={revoking}
                aria-label={fill(t.revokeLabel, { email: e.email })}
                onClick={() =>
                  startRevoke(async () => {
                    const result = await revokeUnlimited(e.userId);
                    if (result.ok) toast.success(t.revoked);
                    else toast.error(t.errors.failed);
                  })
                }
              >
                <Trash2 strokeWidth={1.75} /> {t.revoke}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Toaster />
    </div>
  );
}
