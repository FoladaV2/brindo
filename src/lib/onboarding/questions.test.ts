import { describe, expect, it } from "vitest";
import { copy } from "@content/copy.ka";
import { answersSchema, QUESTIONS } from "./questions";

describe("onboarding questions", () => {
  it("are ten, each with a title and a label for every option", () => {
    expect(QUESTIONS).toHaveLength(10);
    for (const q of QUESTIONS) {
      const strings = copy.onboarding.questions[q.id];
      expect(strings.title.length).toBeGreaterThan(0);
      for (const option of q.options) expect((strings.options as Record<string, string>)[option]).toBeTruthy();
    }
  });

  it("accept known answers and any subset (questions can be skipped)", () => {
    expect(answersSchema.safeParse({ eventType: "birthday", guests: "80to150", source: "friend" }).success).toBe(true);
    expect(answersSchema.safeParse({}).success).toBe(true);
  });

  it("reject unknown questions and unknown options", () => {
    expect(answersSchema.safeParse({ eventType: "funeral" }).success).toBe(false);
    expect(answersSchema.safeParse({ phone: "555" }).success).toBe(false);
    expect(answersSchema.safeParse({ age: 30 }).success).toBe(false);
  });
});
