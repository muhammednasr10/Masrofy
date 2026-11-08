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

    const summary = getAggregatedSubWalletSummary("cib", [parent, card], transactions);
    expect(summary.parentOwnBalance).toBe(500);
    expect(summary.assetTotal).toBe(1300);
  });

  it("does not let a negative parent ledger drag down card balances", () => {
    const parent = makeWallet({ id: "cib", name: "بنك CIB", opening_balance: 0 });
    const debit = makeWallet({
      id: "debit",
      name: "خصم",
      parent_wallet_id: "cib",
      wallet_type: "card",
      card_kind: "debit",
      opening_balance: 12000,
    });
    const credit = makeWallet({
      id: "credit",
      name: "كريديت",
      parent_wallet_id: "cib",
      wallet_type: "card",
      card_kind: "credit",
      opening_balance: 57425,
      credit_limit: 80000,
    });
    const transactions = [
      makeTransaction({
        id: "parent-expense",
        wallet_id: "cib",
        amount: 57425,
        type: "expense",
      }),
    ];

    const summary = getAggregatedSubWalletSummary(
      "cib",
      [parent, debit, credit],
      transactions,
    );

    expect(summary.parentOwnBalance).toBe(-57425);
    expect(summary.creditTotal).toBe(57425);
    expect(summary.liquidTotal).toBe(12000);
    expect(summary.assetTotal).toBe(12000);
  });
});
