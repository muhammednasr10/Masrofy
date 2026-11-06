import { describe, expect, it } from "vitest";
import {
  calculateWalletBalance,
  getCreditAvailable,
  getCreditOwed,
  getWalletNetWorthContribution,
  getWalletTransactionNet,
  openingBalanceFromCurrentBalance,
} from "@/lib/wallets/balance";
import { makeInvestment, makeTransaction, makeWallet } from "@/test/factories";

describe("getWalletTransactionNet", () => {
  it("adds income and subtracts expenses for the same wallet", () => {
    const wallet = makeWallet();
    const transactions = [
      makeTransaction({ type: "income", amount: 500 }),
      makeTransaction({ id: "tx-2", type: "expense", amount: 200 }),
      makeTransaction({ id: "tx-3", wallet_id: "other-wallet", type: "income", amount: 999 }),
    ];

    expect(getWalletTransactionNet(wallet.id, transactions, "2026-12-31")).toBe(300);
  });

  it("ignores a payment dated after today", () => {
    const wallet = makeWallet();
    const transactions = [
      makeTransaction({ type: "expense", amount: 6000, transaction_date: "2027-01-15" }),
    ];

    expect(getWalletTransactionNet(wallet.id, transactions, "2026-11-06")).toBe(0);
  });

  it("handles internal transfer in and out roles", () => {
    const wallet = makeWallet();
    const transactions = [
      makeTransaction({
        id: "tx-in",
        type: "transfer",
        transfer_role: "in",
        amount: 150,
        category_id: null,
      }),
      makeTransaction({
        id: "tx-out",
        type: "transfer",
        transfer_role: "out",
        amount: 50,
        category_id: null,
      }),
    ];

    expect(getWalletTransactionNet(wallet.id, transactions, "2026-12-31")).toBe(100);
  });
});

describe("calculateWalletBalance", () => {
  it("returns opening balance plus net transactions for cash wallets", () => {
    const wallet = makeWallet({ opening_balance: 1000 });
    const transactions = [
      makeTransaction({ type: "income", amount: 400 }),
      makeTransaction({ id: "tx-2", type: "expense", amount: 150 }),
    ];

    expect(calculateWalletBalance(wallet, transactions, [], "2026-12-31")).toBe(1250);
  });

  it("returns owed amount for credit wallets", () => {
    const wallet = makeWallet({
      wallet_type: "card",
      card_kind: "credit",
      opening_balance: 0,
      credit_limit: 5000,
    });
    const transactions = [makeTransaction({ type: "expense", amount: 800 })];

    expect(getCreditOwed(wallet, transactions, "2026-12-31")).toBe(800);
    expect(calculateWalletBalance(wallet, transactions, [], "2026-12-31")).toBe(800);
    expect(getWalletNetWorthContribution(wallet, transactions, [], "2026-12-31")).toBe(-800);
  });

  it("returns linked investment value for investment wallets", () => {
    const investment = makeInvestment({ current_value: 7500 });
    const wallet = makeWallet({
      wallet_type: "investment",
      investment_id: investment.id,
      opening_balance: 0,
    });

    expect(calculateWalletBalance(wallet, [], [investment])).toBe(7500);
  });
});

describe("getCreditAvailable", () => {
  it("returns remaining credit limit after spending", () => {
    const wallet = makeWallet({
      wallet_type: "card",
      card_kind: "credit",
      opening_balance: 0,
      credit_limit: 3000,
    });
    const transactions = [makeTransaction({ type: "expense", amount: 1200 })];

    expect(getCreditAvailable(wallet, transactions, "2026-12-31")).toBe(1800);
  });

  it("returns null for non-credit wallets", () => {
    expect(getCreditAvailable(makeWallet(), [])).toBeNull();
  });
});

describe("openingBalanceFromCurrentBalance", () => {
  it("derives opening balance from current balance and transactions", () => {
    const wallet = makeWallet({ opening_balance: 1000 });
    const transactions = [
      makeTransaction({ type: "income", amount: 250 }),
      makeTransaction({ id: "tx-2", type: "expense", amount: 50 }),
    ];

    expect(openingBalanceFromCurrentBalance(1200, wallet, transactions, "2026-12-31")).toBe(1000);
  });
});
