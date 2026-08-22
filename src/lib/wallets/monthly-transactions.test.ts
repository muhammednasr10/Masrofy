import { describe, expect, it } from "vitest";
import type { Transaction, Wallet } from "@/lib/types/database";
import { getWalletMonthlyTransactions } from "@/lib/wallets/monthly-transactions";

function makeWallet(id: string, parentId: string | null = null): Wallet {
  return {
    id,
    user_id: "user-1",
    name: id,
    icon: "💰",
    color: "#000",
    wallet_type: "bank",
    card_kind: null,
    parent_wallet_id: parentId,
    investment_id: null,
    opening_balance: 0,
    credit_limit: null,
    is_default: false,
    sort_order: 1,
    created_at: "2026-01-01",
  };
}

function makeTransaction(
  id: string,
  walletId: string,
  date: string,
  type: Transaction["type"] = "expense",
): Transaction {
  return {
    id,
    user_id: "user-1",
    wallet_id: walletId,
    category_id: null,
    recurring_transaction_id: null,
    internal_transfer_id: null,
    transfer_role: null,
    amount: 100,
    type,
    note: null,
    transaction_date: date,
    created_at: `${date}T12:00:00.000Z`,
  };
}

describe("getWalletMonthlyTransactions", () => {
  const wallets = [makeWallet("parent"), makeWallet("child", "parent")];

  it("returns only transactions for the wallet in the current month", () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;
    const transactions = [
      makeTransaction("tx-1", "parent", month),
      makeTransaction("tx-2", "child", month),
      makeTransaction("tx-3", "parent", "2020-01-15"),
    ];

    const result = getWalletMonthlyTransactions("parent", wallets, transactions, {
      includeDescendants: false,
    });

    expect(result.map((transaction) => transaction.id)).toEqual(["tx-1"]);
  });

  it("includes descendant wallet transactions when requested", () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`;
    const transactions = [
      makeTransaction("tx-1", "parent", month),
      makeTransaction("tx-2", "child", month),
    ];

    const result = getWalletMonthlyTransactions("parent", wallets, transactions, {
      includeDescendants: true,
    });

    expect(result.map((transaction) => transaction.id)).toEqual(["tx-1", "tx-2"]);
  });
});
