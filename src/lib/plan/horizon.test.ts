import { describe, expect, it } from "vitest";
import { occurrenceCount, sumHorizonExpenses } from "@/lib/plan/horizon";

describe("full plan recurrence", () => {
  it("counts daily, weekly, monthly, and yearly repeats inside the period", () => {
    expect(occurrenceCount("daily", "2026-10-01", "2026-10-03")).toBe(3);
    expect(occurrenceCount("weekly", "2026-10-01", "2026-10-31")).toBe(5);
    expect(occurrenceCount("monthly", "2026-10-15", "2027-01-15")).toBe(4);
    expect(occurrenceCount("monthly", "2026-01-31", "2026-03-31")).toBe(2);
    expect(occurrenceCount("yearly", "2026-10-01", "2028-10-01")).toBe(3);
  });

  it("counts only the repeats that fall in the open month", () => {
    expect(occurrenceCount("weekly", "2026-01-01", "2026-12-31", "2026-10-01", "2026-10-31")).toBe(5);
    expect(
      sumHorizonExpenses(
        [
          {
            amount: 100,
            cadence: "monthly",
            startDate: "2026-10-01",
            endDate: "2027-09-30",
          },
          {
            amount: 50,
            cadence: "weekly",
            startDate: "2026-11-01",
            endDate: "2026-11-30",
          },
        ],
        "2026-10-01",
        "2026-10-31",
      ),
    ).toBe(100);
  });
});
