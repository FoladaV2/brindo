/**
 * Event dates are stored as Tbilisi wall-clock time ("2027-06-12T17:00"). Georgia has kept UTC+4 all
 * year since 2005, so the conversion is a fixed offset; datetime.test.ts checks it against the tz database.
 */
export const TBILISI_UTC_OFFSET = "+04:00";

/** The event's moment in time, as epoch milliseconds. */
export function eventInstant(startsAt: string): number {
  return Date.parse(`${startsAt}:00${TBILISI_UTC_OFFSET}`);
}

export type DateParts = {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** HH:MM */
  time: string;
};

/** Calendar parts of a Tbilisi wall-clock date ("2027-06-12" or "2027-06-12T17:00"). */
export function dateParts(local: string): DateParts {
  const [year, month, day] = [+local.slice(0, 4), +local.slice(5, 7), +local.slice(8, 10)];
  return {
    year,
    month,
    day,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    time: local.slice(11, 16),
  };
}

export type Countdown = { days: number; hours: number; minutes: number; seconds: number };

/** Time left until `target`, in whole units. Zero once the moment has passed. */
export function countdown(target: number, now: number): Countdown {
  const total = Math.max(0, Math.floor((target - now) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** Today's date in Tbilisi, YYYY-MM-DD. */
export function tbilisiToday(now: number): string {
  return new Date(now + 4 * 3600_000).toISOString().slice(0, 10);
}

/** Guests may answer until the end of the deadline day, Tbilisi time. */
export function rsvpOpen(deadline: string, now: number): boolean {
  return tbilisiToday(now) <= deadline;
}
