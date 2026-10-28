import { describe, expect, it } from "vitest";
import { countdown, dateParts, eventInstant, rsvpOpen } from "./datetime";
import { EVENT_TIME_ZONE } from "./schema";

describe("eventInstant", () => {
  it("reads content times as Tbilisi wall-clock time", () => {
    expect(new Date(eventInstant("2027-06-12T17:00")).toISOString()).toBe("2027-06-12T13:00:00.000Z");
  });

  it("matches the tz database for Asia/Tbilisi across the year", () => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: EVENT_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    for (let month = 1; month <= 12; month++) {
      const local = `2027-${String(month).padStart(2, "0")}-15T19:30`;
      expect(fmt.format(eventInstant(local)).replace(", ", "T")).toBe(local);
    }
  });
});

describe("dateParts", () => {
  it("gives the weekday of the local date", () => {
    expect(dateParts("2027-06-12T17:00")).toEqual({ year: 2027, month: 6, day: 12, weekday: 6, time: "17:00" });
    expect(dateParts("2027-05-15").weekday).toBe(6);
  });
});

describe("countdown", () => {
  it("splits the remaining time", () => {
    const target = Date.UTC(2027, 0, 2, 3, 4, 5);
    expect(countdown(target, Date.UTC(2027, 0, 1))).toEqual({ days: 1, hours: 3, minutes: 4, seconds: 5 });
  });

  it("stops at zero", () => {
    expect(countdown(0, 1000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});

describe("rsvpOpen", () => {
  it("stays open through the end of the deadline day in Tbilisi", () => {
    expect(rsvpOpen("2027-05-15", Date.parse("2027-05-15T19:59:59Z"))).toBe(true); // 23:59:59 in Tbilisi
    expect(rsvpOpen("2027-05-15", Date.parse("2027-05-15T20:00:00Z"))).toBe(false); // 00:00 on the 16th
    expect(rsvpOpen("2027-05-15", Date.parse("2027-04-01T00:00:00Z"))).toBe(true);
  });
});
