"use client";

import WalletBalanceCell from "@/components/wallets/WalletBalanceCell";
import type { Investment, Transaction, Wallet } from "@/lib/types/database";
import { resolveWalletDisplayLabel } from "@/lib/wallets";

type WalletSubWalletsListProps = {
  childWallets: Wallet[];
  transactions: Transaction[];
  investments: Investment[];
  currency: string;
};

export default function WalletSubWalletsList({
  childWallets,
  transactions,
  investments,
  currency,
}: WalletSubWalletsListProps) {
  return (
    <ul className="space-y-2">
      {childWallets.map((child) => (
        <li
          key={child.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
              style={{ backgroundColor: `${child.color}18` }}
            >
              {child.icon}
            </span>
            <div className="min-w-0">
              <p className="wrap-text text-sm font-medium text-slate-900">{child.name}</p>
              <p className="text-xs text-slate-500">{resolveWalletDisplayLabel(child)}</p>
            </div>
          </div>
          <WalletBalanceCell
            wallet={child}
            transactions={transactions}
            investments={investments}
            currency={currency}
            compact
          />
        </li>
      ))}
    </ul>
  );
}
