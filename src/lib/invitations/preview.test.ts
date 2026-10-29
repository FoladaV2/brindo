import { describe, expect, it } from "vitest";
import { copy } from "@content/copy.ka";
import { placeholderDate, previewContent } from "./preview";
import { invitationDraftSchema } from "./schema";

describe("previewContent", () => {
  it("renders an empty draft with placeholders", () => {
    const out = previewContent({}, "2027-06-12T18:00", "wedding");
    expect(out.partners).toEqual(copy.editor.placeholders.partners);
    expect(out.startsAt).toBe("2027-06-12T18:00");
    expect(out.rsvpDeadline).toBe("2027-06-12");
    expect(out.program).toEqual([]);
  });

  it("gives other events a placeholder title instead of names", () => {
    const out = previewContent({}, "2027-06-12T18:00", "birthday");
    expect(out.partners).toBeUndefined();
    expect(out.title).toBe(copy.events.titlePlaceholders.birthday);
  });

  it("keeps what the host filled in and drops half-filled program rows", () => {
    const draft = invitationDraftSchema.parse({
      partners: ["ნინო", ""],
      startsAt: "2027-09-04T19:00",
      program: [
        { time: "19:00", label: "ვახშამი" },
        { time: "21:00", label: "" },
      ],
      rsvpDeadline: "2027-10-01",
    });
    const out = previewContent(draft, "2027-06-12T18:00", "wedding");
    expect(out.partners).toEqual(["ნინო", copy.editor.placeholders.partners[1]]);
    expect(out.program).toEqual([{ time: "19:00", label: "ვახშამი" }]);
    expect(out.rsvpDeadline).toBe("2027-09-04"); // deadline after the event falls back to the event day
  });

  it("makes a placeholder date six months ahead", () => {
    expect(placeholderDate(new Date("2026-10-28T10:00:00Z"))).toBe("2027-04-28T18:00");
  });
});
