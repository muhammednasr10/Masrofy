import { describe, expect, it } from "vitest";
import { isReminderDue, previousLocalDateKey } from "@/lib/notifications/daily-reminder";

describe("daily reminder schedule", () => {
  it("waits until the chosen time, then stays due for the rest of the day", () => {
    const before = new Date(2026, 10, 6, 20, 59, 0);
    const onTime = new Date(2026, 10, 6, 21, 0, 0);
    const later = new Date(2026, 10, 6, 23, 10, 0);

    expect(isReminderDue(before, "21:00", null)).toBe(false);
    expect(isReminderDue(onTime, "21:00", null)).toBe(true);
    expect(isReminderDue(later, "21:00", null)).toBe(true);
  });

  it("sends each reminder once per day", () => {
    const now = new Date(2026, 10, 6, 21, 5, 0);

    expect(isReminderDue(now, "21:00", "2026-11-06")).toBe(false);
    expect(isReminderDue(now, "21:00", "2026-11-05")).toBe(true);
  });

  it("uses the previous local calendar day", () => {
    expect(previousLocalDateKey(new Date(2026, 10, 6, 9, 0, 0))).toBe("2026-11-05");
  });
});
