import { describe, expect, it } from "vitest";
import { formatMoneyInput, roundMoney } from "@/lib/utils/money";

describe("roundMoney", () => {
  it("removes float tails like 867.9999999999986", () => {
    expect(roundMoney(867.9999999999986)).toBe(868);
    expect(formatMoneyInput(867.9999999999986)).toBe("868");
  });

  it("keeps two decimal places when needed", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(formatMoneyInput(10.5)).toBe("10.50");
  });
});
