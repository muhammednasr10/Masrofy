import { describe, expect, it } from "vitest";
import {
  pickQuickAddDefaults,
  quickExpenseDate,
  readQuickAddMemory,
  writeQuickAddMemory,
  QUICK_ADD_STORAGE_KEY,
} from "@/lib/expenses/quick-add";
import type { Category, Wallet } from "@/lib/types/database";

function memoryStorage(initial: string | null = null) {
  let value = initial;

  return {
    getItem: (key: string) => (key === QUICK_ADD_STORAGE_KEY ? value : null),
    setItem: (key: string, next: string) => {
      if (key === QUICK_ADD_STORAGE_KEY) {
        value = next;
      }
    },
  };
}

describe("quick expense date", () => {
  const month = { start: "2026-08-01", end: "2026-08-31" };

  it("uses today when today is inside the open month", () => {
    expect(quickExpenseDate(month, "2026-08-12")).toBe("2026-08-12");
  });

  it("uses the month start when today is outside the open month", () => {
    expect(quickExpenseDate(month, "2026-09-30")).toBe("2026-08-01");
  });
});

describe("quick add memory", () => {
  it("remembers the last category and wallet", () => {
    const storage = memoryStorage();
    writeQuickAddMemory(storage, { categoryId: "food", walletId: "cash" });
    expect(readQuickAddMemory(storage)).toEqual({ categoryId: "food", walletId: "cash" });
  });

  it("falls back when the remembered ids are gone", () => {
    const categories = [{ id: "food" }] as Category[];
    const wallets = [{ id: "cash", is_default: true }] as Wallet[];

    expect(
      pickQuickAddDefaults({
        categories,
        wallets,
        memory: { categoryId: "missing", walletId: "missing" },
      }),
    ).toEqual({ categoryId: "food", walletId: "cash" });
  });
});
