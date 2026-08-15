import { describe, expect, it } from "vitest";
import { makeWallet } from "@/test/factories";
import {
  buildReconcilableDisplayRows,
  getReconcilableWallets,
  getReconcilableWalletsForFocus,
} from "@/lib/wallets/reconciliation";

describe("reconcilable wallet display", () => {
  const bank = makeWallet({
    id: "bank",
    name: "البنك",
    wallet_type: "bank",
    parent_wallet_id: null,
    sort_order: 1,
  });
  const debit = makeWallet({
    id: "debit",
    name: "خصم",
    wallet_type: "card",
    card_kind: "debit",
    parent_wallet_id: "bank",
    sort_order: 1,
  });
  const credit = makeWallet({
    id: "credit",
    name: "ائتمان",
    wallet_type: "card",
    card_kind: "credit",
    parent_wallet_id: "bank",
    sort_order: 2,
  });
  const cash = makeWallet({
    id: "cash",
    name: "كاش",
    wallet_type: "cash",
    parent_wallet_id: null,
    sort_order: 2,
  });
  const investment = makeWallet({
    id: "invest",
    name: "استثمار",
    wallet_type: "investment",
    investment_id: "inv-1",
    parent_wallet_id: null,
    sort_order: 3,
  });
  const wallets = [bank, debit, credit, cash, investment];

  it("keeps sub-wallets visible even when the parent bank is not reconcilable", () => {
    const reconcilable = getReconcilableWallets(wallets);
    const rows = buildReconcilableDisplayRows(wallets, reconcilable);

    expect(rows.map((row) => row.wallet.id)).toEqual(["debit", "credit", "cash"]);
  });

  it("shows descendants when focusing a parent bank", () => {
    const reconcilable = getReconcilableWalletsForFocus(wallets, "bank");
    const rows = buildReconcilableDisplayRows(wallets, reconcilable);

    expect(rows.map((row) => row.wallet.id)).toEqual(["debit", "credit"]);
  });
});
