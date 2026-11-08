import { describe, expect, it } from "vitest";
import { isBalanceAdjustmentTransaction } from "@/lib/wallets/set-current-balance";

describe("isBalanceAdjustmentTransaction", () => {
  it("detects auto balance-update notes", () => {
    expect(
      isBalanceAdjustmentTransaction({ note: "إيراد غير معروف — تحديث رصيد" }),
    ).toBe(true);
    expect(
      isBalanceAdjustmentTransaction({ note: "مصروف غير معروف — تحديث أرصدة المحافظ" }),
    ).toBe(true);
    expect(
      isBalanceAdjustmentTransaction({ note: "تعديل رصيد من صفحة المحافظ" }),
    ).toBe(true);
    expect(isBalanceAdjustmentTransaction({ note: "شراء بقالة" })).toBe(false);
    expect(isBalanceAdjustmentTransaction({ note: null })).toBe(false);
  });
});
