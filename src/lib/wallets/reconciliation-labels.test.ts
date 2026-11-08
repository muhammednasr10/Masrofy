import { describe, expect, it } from "vitest";
import { getBalanceDifferenceKind } from "@/lib/wallets/reconciliation-labels";

describe("balance difference kind", () => {
  it("treats a higher cash balance as income", () => {
    expect(getBalanceDifferenceKind(250, false)).toBe("income");
  });

  it("treats a lower cash balance as expense", () => {
    expect(getBalanceDifferenceKind(-100, false)).toBe("expense");
  });

  it("flips the meaning for credit cards", () => {
    expect(getBalanceDifferenceKind(200, true)).toBe("expense");
    expect(getBalanceDifferenceKind(-150, true)).toBe("income");
  });
});
