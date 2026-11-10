import { describe, expect, it } from "vitest";
import { sortTransactionsNewestFirst } from "@/lib/expenses/sort-transactions";

describe("sortTransactionsNewestFirst", () => {
  it("orders by date then created_at newest first", () => {
    const sorted = sortTransactionsNewestFirst([
      {
        id: "a",
        transaction_date: "2026-11-10",
        created_at: "2026-11-10T08:00:00.000Z",
      },
      {
        id: "b",
        transaction_date: "2026-11-10",
        created_at: "2026-11-10T12:00:00.000Z",
      },
      {
        id: "c",
        transaction_date: "2026-11-09",
        created_at: "2026-11-09T18:00:00.000Z",
      },
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });
});
