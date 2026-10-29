import type { z } from "zod";
import { copy } from "@content/copy.ka";
import { isCoupleEvent, type EventType } from "@/lib/events";
import { checkComplete, invitationDraftSchema, type InvitationDraft, type InvitationDraftInput } from "@/lib/invitations/schema";

/**
 * The editor's form: every field as the plain string the input shows. Converted to a draft
 * (blank = missing) for saving and previewing, and checked against the full rules for errors.
 */
export type ProgramRow = { key: string; time: string; label: string };
export type Photo = NonNullable<InvitationDraft["photo"]>;

export type FormState = {
  /** Wedding and engagement. Kept while another type is chosen, so switching back loses nothing. */
  partners: [string, string];
  /** Every other event. */
  title: string;
  date: string;
  time: string;
  venue: { name: string; address: string; city: string; mapQuery: string };
  message: string;
  program: ProgramRow[];
  rsvpDeadline: string;
  dressCode: string;
  photo: Photo | null;
};

let rowCounter = 0;
/** Stable React key for a program row; never saved. */
export const newRowKey = () => `row-${++rowCounter}`;

/** Form state from stored content. Content that no longer parses starts the form empty. */
export function fromContent(content: unknown): FormState {
  const parsed = invitationDraftSchema.safeParse(content);
  const d: InvitationDraft = parsed.success ? parsed.data : {};
  return {
    partners: [d.partners?.[0] ?? "", d.partners?.[1] ?? ""],
    title: d.title ?? "",
    date: d.startsAt?.slice(0, 10) ?? "",
    time: d.startsAt?.slice(11, 16) ?? "",
    venue: {
      name: d.venue?.name ?? "",
      address: d.venue?.address ?? "",
      city: d.venue?.city ?? "",
      mapQuery: d.venue?.mapQuery ?? "",
    },
    message: d.message ?? "",
    program: (d.program ?? []).map((row) => ({ key: newRowKey(), time: row.time ?? "", label: row.label ?? "" })),
    rsvpDeadline: d.rsvpDeadline ?? "",
    dressCode: d.dressCode ?? "",
    photo: d.photo ?? null,
  };
}

/** What the editor saves: the names or the title (by event type). Date and time count once both are set. */
export function toDraftInput(form: FormState, eventType: EventType): InvitationDraftInput {
  const couple = isCoupleEvent(eventType);
  return {
    partners: couple ? form.partners : undefined,
    title: couple ? undefined : form.title,
    startsAt: form.date && form.time ? `${form.date}T${form.time}` : undefined,
    venue: { ...form.venue },
    message: form.message,
    program: form.program.map(({ time, label }) => ({ time, label })),
    rsvpDeadline: form.rsvpDeadline,
    dressCode: form.dressCode,
    photo: form.photo ?? undefined,
  };
}

/** Field keys the form shows errors under: "partners.0", "venue.city", "program.2.label", "date", … */
export type FieldErrors = Record<string, string>;

const e = copy.editor.errors;

function messageFor(issue: z.core.$ZodIssue, key: string): string {
  switch (issue.code) {
    case "invalid_type":
    case "too_small":
      return e.required;
    case "too_big":
      return e.tooLong;
    case "invalid_format":
      if (key.startsWith("partners")) return e.name;
      if (key === "title") return e.title;
      if (key === "time" || key.endsWith(".time")) return e.time;
      return e.date;
    case "custom":
      if (/names or a title/i.test(issue.message)) return e.required;
      if (/lines/i.test(issue.message)) return e.tooManyLines;
      if (/word/i.test(issue.message)) return e.nameWord;
      if (/deadline/i.test(issue.message)) return e.deadline;
      if (/date/i.test(issue.message)) return e.date;
      return e.invalid;
    default:
      return e.invalid;
  }
}

/** A copy of `input` with the value at each path removed. */
function without(input: InvitationDraftInput, paths: PropertyKey[][]): InvitationDraftInput {
  const copyOf = structuredClone(input) as Record<PropertyKey, unknown>;
  for (const path of paths) {
    let node = copyOf;
    for (const key of path.slice(0, -1)) node = (node?.[key] ?? {}) as Record<PropertyKey, unknown>;
    if (node && path.length) node[path[path.length - 1]] = undefined;
  }
  return copyOf as InvitationDraftInput;
}

/**
 * Georgian error per field, from the same zod rules that guard saving and publishing. Fields that
 * break the draft rules (format, length) are set aside first, so the full rules (required fields,
 * deadline before the event) still report on everything else in the same pass.
 */
export function fieldErrors(form: FormState, eventType: EventType): FieldErrors {
  const input = toDraftInput(form, eventType);
  const draft = invitationDraftSchema.safeParse(input);
  const issues = draft.success ? [] : draft.error.issues;
  const rest = checkComplete(draft.success ? input : without(input, issues.map((i) => i.path)));
  if (!rest.success) issues.push(...rest.error.issues);

  const errors: FieldErrors = {};
  for (const issue of issues) {
    let key = issue.path.join(".");
    // The date and time are one value in content; point the error at whichever input needs attention.
    if (key === "startsAt") key = !form.date ? "date" : !form.time ? "time" : "date";
    errors[key] ??= messageFor(issue, key);
  }
  // zod runs the schema's deadline refinement only once every field is valid; report it regardless.
  if (form.date && form.rsvpDeadline && form.rsvpDeadline > form.date) errors.rsvpDeadline ??= e.deadline;
  return errors;
}
