import { describe, expect, it } from "vitest";
import { debtRemaining, splitDebtPayments, summarizeDebts } from "@/lib/debts/balance";

describe("debt remaining", () => {
  it("subtracts payments from the principal", () => {
    expect(debtRemaining(12000, 2500)).toBe(9500);
  });

  it("stops at zero when payments cover the debt", () => {
    expect(debtRemaining(1000, 1000)).toBe(0);
    expect(debtRemaining(1000, 1400)).toBe(0);
  });

  it("splits what I owe from what is owed to me", () => {
    expect(
      summarizeDebts([
        { direction: "i_owe", principal: 5000, paid: 1000 },
        { direction: "owed_to_me", principal: 800, paid: 300 },
      ]),
    ).toEqual({ iOwe: 4000, owedToMe: 500 });
  });

  it("keeps a future payment scheduled until its date", () => {
    const split = splitDebtPayments(
      [
        { debt_id: "mama", amount: 6000, paid_on: "2027-01-15" },
        { debt_id: "mama", amount: 1000, paid_on: "2026-11-01" },
      ],
      "2026-11-06",
    );

    expect(split.settled.get("mama")).toBe(1000);
    expect(split.scheduled.get("mama")).toBe(6000);
    expect(debtRemaining(10000, split.settled.get("mama") ?? 0)).toBe(9000);
  });
});
