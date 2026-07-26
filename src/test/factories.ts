import type { Investment, Transaction, Wallet } from "@/lib/types/database";

export function makeWallet(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: "wallet-1",
    user_id: "user-1",
    name: "Cash",
    wallet_type: "cash",
    icon: "💵",
    color: "#22c55e",
    opening_balance: 1000,
    is_default: true,
    sort_order: 1,
    parent_wallet_id: null,
    investment_id: null,
    card_kind: null,
    credit_limit: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    user_id: "user-1",
    wallet_id: "wallet-1",
    category_id: "cat-1",
    recurring_transaction_id: null,
    internal_transfer_id: null,
    transfer_role: null,
    amount: 100,
    type: "expense",
    note: null,
    transaction_date: "2026-07-01",
    created_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: "inv-1",
    user_id: "user-1",
    name: "Gold",
    investment_type: "gold",
    icon: "🥇",
    color: "#eab308",
    cost_basis: 5000,
    current_value: 6000,
    quantity: null,
    unit_label: null,
    notes: null,
    is_fixed_return: false,
    fixed_return_percent: null,
    collection_period: null,
    collection_date: null,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
