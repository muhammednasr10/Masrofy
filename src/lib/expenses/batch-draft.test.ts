import { describe, expect, it } from "vitest";
import { parseTransactionDrafts, type TransactionDraftLine } from "@/lib/expenses/batch-draft";

function line(overrides: Partial<TransactionDraftLine> = {}): TransactionDraftLine {
  return {
    id: "line-1",
    type: "expense",
    categoryId: "food",
    amount: "50",
    note: "",
    ...overrides,
  };
}

describe("parseTransactionDrafts", () => {
  it("keeps filled lines and skips a trailing empty row", () => {
    const parsed = parseTransactionDrafts([
      line({ id: "a", amount: "20" }),
      line({ id: "b", type: "income", categoryId: "", amount: "100", note: "راتب" }),
      line({ id: "c", categoryId: "", amount: "", note: "" }),
    ]);

    expect(parsed.error).toBeNull();
    expect(parsed.lines).toEqual([
      { type: "expense", categoryId: "food", amount: 20, note: null },
      { type: "income", categoryId: null, amount: 100, note: "راتب" },
    ]);
  });

  it("asks for a category on every expense line", () => {
    expect(parseTransactionDrafts([line({ categoryId: "", amount: "15" })]).error).toBe(
      "اختَر فئة لكل مصروف.",
    );
  });
});
