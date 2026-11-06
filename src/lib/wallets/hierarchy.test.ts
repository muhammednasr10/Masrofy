import { describe, expect, it } from "vitest";
import { makeTransaction, makeWallet } from "@/test/factories";
import { getAggregatedSubWalletSummary, buildWalletDisplayRows } from "@/lib/wallets/hierarchy";

describe("buildWalletDisplayRows amount order", () => {
  it("sorts top-level wallets from largest balance to smallest", () => {
    const wallets = [
      makeWallet({ id: "misr", name: "بنك مصر", opening_balance: 70, sort_order: 1 }),
      makeWallet({ id: "cib", name: "بنك CIB", opening_balance: 10213, sort_order: 2 }),
      makeWallet({ id: "cash", name: "محفظة شخصية", opening_balance: 3350, sort_order: 3 }),
    ];

    expect(
      buildWalletDisplayRows(wallets, { transactions: [], investments: [] }).map(
        (row) => row.wallet.id,
      ),
    ).toEqual(["cib", "cash", "misr"]);
  });

  it("keeps children under the parent and sorts them by amount", () => {
    const wallets = [
      makeWallet({ id: "cib", name: "بنك CIB", opening_balance: 0, sort_order: 1 }),
      makeWallet({
        id: "small-card",
        name: "كارت صغير",
        parent_wallet_id: "cib",
        wallet_type: "card",
        card_kind: "debit",
        opening_balance: 100,
        sort_order: 1,
      }),
      makeWallet({
        id: "anoda",
        name: "كارت انودا",
        parent_wallet_id: "cib",
        wallet_type: "card",
        card_kind: "debit",
        opening_balance: 800,
        sort_order: 2,
      }),
    ];

    expect(
      buildWalletDisplayRows(wallets, { transactions: [], investments: [] }).map(
        (row) => row.wallet.id,
      ),
    ).toEqual(["cib", "anoda", "small-card"]);
  });

  it("keeps money transferred onto a parent that has sub-wallets", () => {
    const parent = makeWallet({ id: "cib", name: "بنك CIB", opening_balance: 0 });
    const card = makeWallet({
      id: "anoda",
      name: "كارت انودا",
      parent_wallet_id: "cib",
      wallet_type: "card",
      card_kind: "debit",
      opening_balance: 800,
    });
    const transactions = [
      makeTransaction({
        id: "in",
        wallet_id: "cib",
        amount: 500,
        type: "transfer",
        transfer_role: "in",
      }),
    ];

    expect(getAggregatedSubWalletSummary("cib", [parent, card], transactions).assetTotal).toBe(1300);
  });
});
