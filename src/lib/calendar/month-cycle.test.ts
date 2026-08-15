import { describe, expect, it } from "vitest";
import {
  getMonthRange,
  getPlanMonthKey,
  getYearMonthKeys,
  isDateInMonthRange,
  normalizeMonthStartDay,
  parsePlanMonthKey,
  shiftPlanMonthKey,
} from "@/lib/calendar";

describe("getMonthRange", () => {
  it("uses the calendar month when the start day is 1", () => {
    const range = getMonthRange(new Date(2026, 7, 15), "en", 1);

    expect(range.start).toBe("2026-08-01");
    expect(range.end).toBe("2026-08-31");
    expect(range.label).toBe("August 2026");
  });

  it("starts the period on the configured day when the date is before that day", () => {
    const range = getMonthRange(new Date(2026, 7, 15), "en", 25);

    expect(range.start).toBe("2026-07-25");
    expect(range.end).toBe("2026-08-24");
  });

  it("starts a new period on the configured day", () => {
    const range = getMonthRange(new Date(2026, 7, 25), "en", 25);

    expect(range.start).toBe("2026-08-25");
    expect(range.end).toBe("2026-09-24");
  });

  it("crosses the year boundary", () => {
    const range = getMonthRange(new Date(2026, 0, 10), "en", 25);

    expect(range.start).toBe("2025-12-25");
    expect(range.end).toBe("2026-01-24");
  });
});

describe("normalizeMonthStartDay", () => {
  it("clamps invalid values to 1 and values above 28 to 28", () => {
    expect(normalizeMonthStartDay(undefined)).toBe(1);
    expect(normalizeMonthStartDay(0)).toBe(1);
    expect(normalizeMonthStartDay(31)).toBe(28);
    expect(normalizeMonthStartDay(25)).toBe(25);
  });
});

describe("plan month keys", () => {
  it("shifts custom cycles by the configured start day", () => {
    expect(getPlanMonthKey(new Date(2026, 7, 15), 25)).toBe("2026-07");
    expect(shiftPlanMonthKey("2026-07", 1, 25)).toBe("2026-08");
    expect(parsePlanMonthKey("2026-07", 25).getDate()).toBe(25);
  });

  it("builds twelve month keys for a year", () => {
    expect(getYearMonthKeys(2026)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
  });

  it("checks whether a date falls inside a range", () => {
    expect(isDateInMonthRange("2026-08-10", { start: "2026-07-25", end: "2026-08-24" })).toBe(true);
    expect(isDateInMonthRange("2026-07-24", { start: "2026-07-25", end: "2026-08-24" })).toBe(false);
  });
});
