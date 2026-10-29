/**
 * Every kind of event Brindo invites to (SPEC.md "v1 scope"). Ids are stored in
 * invitations.event_type and in onboarding answers; labels live in content/copy.ka.ts.
 */
export const EVENT_TYPES = ["wedding", "engagement", "birthday", "christening", "anniversary", "corporate", "other"] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** Events whose invitation names two people ("ნინო & გიორგი"); every other event has one title. */
export const COUPLE_EVENTS: readonly EventType[] = ["wedding", "engagement"];

export const isEventType = (value: unknown): value is EventType => EVENT_TYPES.includes(value as EventType);

export const isCoupleEvent = (type: EventType) => COUPLE_EVENTS.includes(type);

/** Default cap on how many people one reply may bring. */
export const DEFAULT_MAX_PARTY_SIZE = 6;
