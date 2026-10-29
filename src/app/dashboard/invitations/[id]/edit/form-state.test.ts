import { describe, expect, it } from "vitest";
import { copy } from "@content/copy.ka";
import { invitationContentSchema, invitationDraftSchema } from "@/lib/invitations/schema";
import { fieldErrors, fromContent, toDraftInput, type FormState } from "./form-state";

const weddingErrors = (form: FormState) => fieldErrors(form, "wedding");
const weddingDraft = (form: FormState) => toDraftInput(form, "wedding");

const e = copy.editor.errors;

describe("editor form state", () => {
  it("round-trips complete content", () => {
    const content = invitationContentSchema.parse(copy.samples.full);
    const form = fromContent(content);
    expect(form.date).toBe("2027-06-12");
    expect(form.time).toBe("17:00");
    expect(invitationContentSchema.parse(invitationDraftSchema.parse(weddingDraft(form)))).toEqual(content);
    expect(weddingErrors(form)).toEqual({});
  });

  it("starts empty for a new invitation and reads stored null names", () => {
    const form = fromContent({ partners: ["ნინო", null] });
    expect(form.partners).toEqual(["ნინო", ""]);
    expect(form.program).toEqual([]);
  });

  it("names the missing required fields in Georgian", () => {
    const errors = weddingErrors(fromContent({ partners: ["ნინო", "გიორგი"] }));
    expect(errors).toMatchObject({
      date: e.required,
      "venue.name": e.required,
      "venue.address": e.required,
      "venue.city": e.required,
      rsvpDeadline: e.required,
    });
    expect(errors).not.toHaveProperty("partners.0");
    expect(errors).not.toHaveProperty("message");
  });

  it("points a missing time at the time input", () => {
    const form = { ...fromContent(copy.samples.full), time: "" };
    expect(weddingErrors(form)).toMatchObject({ time: e.required });
  });

  it("explains format, length and cross-field errors", () => {
    const form = fromContent(copy.samples.full);
    form.partners = ["ნინო😀", "გიორგი"];
    form.message = "ა".repeat(401);
    form.rsvpDeadline = "2027-07-01";
    form.program = [{ key: "x", time: "19:00", label: "" }];
    expect(weddingErrors(form)).toMatchObject({
      "partners.0": e.name,
      message: e.tooLong,
      rsvpDeadline: e.deadline,
      "program.0.label": e.required,
    });
  });
});

describe("events with one title", () => {
  it("saves the title and not the names", () => {
    const form = { ...fromContent(copy.samples.full), title: "ანას 30" };
    const draft = toDraftInput(form, "birthday");
    expect(draft.title).toBe("ანას 30");
    expect(draft.partners).toBeUndefined();
    expect(fieldErrors(form, "birthday")).toEqual({});
  });

  it("asks for the title when it is missing", () => {
    const form = fromContent(copy.samples.birthday);
    expect(fieldErrors({ ...form, title: "" }, "birthday")).toMatchObject({ title: e.required });
  });

  it("explains a title with characters the font lacks", () => {
    const form = fromContent(copy.samples.birthday);
    expect(fieldErrors({ ...form, title: "ანას 30 🎉" }, "birthday")).toMatchObject({ title: e.title });
  });
});
