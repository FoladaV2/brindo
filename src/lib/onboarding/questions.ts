import { z } from "zod";
import { EVENT_TYPES } from "@/lib/events";

/**
 * The 10 onboarding questions (SPEC.md "Onboarding"). Ids are stable: they are what the database
 * stores and what marketing analysis groups by. Labels live in content/copy.ka.ts under
 * onboarding.questions, keyed by the same ids.
 */
export const QUESTIONS = [
  { id: "eventType", options: EVENT_TYPES },
  { id: "when", options: ["month", "quarter", "half", "later", "undecided"] },
  { id: "guests", options: ["lt30", "30to80", "80to150", "150to300", "gt300"] },
  { id: "whose", options: ["mine", "family", "friend", "planner", "company"] },
  { id: "inviteHow", options: ["paper", "calls", "messages", "facebook", "undecided"] },
  { id: "hardest", options: ["counting", "chasing", "design", "printing", "time"] },
  { id: "style", options: ["classic", "minimal", "romantic", "bold"] },
  { id: "age", options: ["18to24", "25to34", "35to44", "45to54", "55plus"] },
  { id: "city", options: ["tbilisi", "batumi", "kutaisi", "rustavi", "otherGeorgia", "abroad"] },
  { id: "source", options: ["instagram", "tiktok", "facebook", "friend", "invitation", "google", "other"] },
] as const;

export type Question = (typeof QUESTIONS)[number];
export type QuestionId = Question["id"];

/** Every answer optional (a host may skip any question), but only known options are accepted. */
export const answersSchema = z
  .object(
    Object.fromEntries(QUESTIONS.map((q) => [q.id, z.enum(q.options as unknown as [string, ...string[]]).optional()])) as {
      [Q in Question as Q["id"]]: z.ZodOptional<z.ZodEnum<{ [O in Q["options"][number]]: O }>>;
    },
  )
  .strict();

export type OnboardingAnswers = z.output<typeof answersSchema>;
