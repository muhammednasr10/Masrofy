import { describe, expect, it } from "vitest";
import { groupIdenticalTransactions } from "@/lib/expenses/group-transactions";
import type { OfflineTransaction } from "@/lib/offline/types";

function makeTx(
  overrides: Partial<OfflineTransaction> & Pick<OfflineTransaction, "id" | "amount">,
): OfflineTransaction {
  return {
    user_id: "u1",
    wallet_id: "w1",
    category_id: "c1",
    type: "expense",
    note: null,
    transaction_date: "2026-11-10",
    created_at: "2026-11-10T10:00:00.000Z",
    transfer_role: null,
    transfer_group_id: null,
    ...overrides,
  } as OfflineTransaction;
}

describe("groupIdenticalTransactions", () => {
  it("sums amounts for matching date/category/type/wallet", () => {
    const rows = groupIdenticalTransactions([
      makeTx({ id: "1", amount: 50, created_at: "2026-11-10T09:00:00.000Z" }),
      makeTx({ id: "2", amount: 30, created_at: "2026-11-10T12:00:00.000Z" }),
      makeTx({
        id: "3",
        amount: 20,
        category_id: "c2",
        created_at: "2026-11-10T11:00:00.000Z",
      }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0].amount).toBe(80);
    expect(rows[0].groupIds).toEqual(["2", "1"]);
    expect(rows[0].groupCount).toBe(2);
    expect(rows[1].amount).toBe(20);
    expect(rows[1].groupCount).toBe(1);
  });
});
