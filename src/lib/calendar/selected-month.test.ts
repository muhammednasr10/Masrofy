import { describe, expect, it } from "vitest";
import { readStoredPlanMonthKey, SELECTED_MONTH_STORAGE_KEY } from "@/lib/calendar/selected-month";

function storage(value: string | null): Pick<Storage, "getItem"> {
  return {
    getItem: (key) => (key === SELECTED_MONTH_STORAGE_KEY ? value : null),
  };
}

describe("readStoredPlanMonthKey", () => {
  it("returns a stored year-month key", () => {
    expect(readStoredPlanMonthKey(storage("2026-08"))).toBe("2026-08");
  });

  it("ignores empty and invalid values", () => {
    expect(readStoredPlanMonthKey(storage(null))).toBeNull();
    expect(readStoredPlanMonthKey(storage("2026-13"))).toBeNull();
    expect(readStoredPlanMonthKey(storage("september"))).toBeNull();
  });
});
