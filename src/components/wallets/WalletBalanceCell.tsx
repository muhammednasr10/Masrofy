"use client";

import {
  calculateWalletBalance,
  getCreditAvailable,
  getCreditOwed,
  isCreditWallet,
} from "@/lib/wallets/balance";
import type { ParentWalletBalanceSummary } from "@/lib/wallets/hierarchy";
import { isInvestmentWallet } from "@/lib/wallets/investment-link";
import type { Investment, Transaction, Wallet } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";
import { memo } from "react";

type WalletBalanceCellProps = {
  wallet: Wallet;
  transactions: Transaction[];
  investments?: Investment[];
  currency: string;
  aggregatedSummary?: ParentWalletBalanceSummary | null;
};

function WalletBalanceCellComponent({
  wallet,
  transactions,
  investments = [],
  currency,
  aggregatedSummary = null,
}: WalletBalanceCellProps) {
  if (aggregatedSummary) {
    return (
      <div className="space-y-1">
        <p className="font-semibold text-slate-900">
          {formatCurrency(aggregatedSummary.assetTotal, currency)}
        </p>
        <p className="text-xs text-slate-500">مجموع المحافظ الفرعية (بدون كريديت)</p>
        {aggregatedSummary.creditNotes.map((note) => (
          <p key={note.walletName} className="text-xs text-amber-700">
            ملاحظة: {note.walletName} — مستحق {formatCurrency(note.owed, currency)}
            {note.limit != null
              ? ` • متاح ${formatCurrency(note.available ?? 0, currency)}`
              : ""}
          </p>
        ))}
      </div>
    );
  }

  if (isCreditWallet(wallet)) {
    const owed = getCreditOwed(wallet, transactions);
    const available = getCreditAvailable(wallet, transactions);

    return (
      <div className="space-y-1">
        <p className="font-semibold text-red-600">مستحق: {formatCurrency(owed, currency)}</p>
        {wallet.credit_limit != null ? (
          <>
            <p className="text-xs text-slate-500">
              الحد: {formatCurrency(Number(wallet.credit_limit), currency)}
            </p>
            {available != null ? (
              <p className="text-xs text-emerald-700">
                متاح: {formatCurrency(available, currency)}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    );
  }

  if (isInvestmentWallet(wallet)) {
    return (
      <div className="space-y-1">
        <p className="font-semibold text-slate-900">
          {formatCurrency(calculateWalletBalance(wallet, transactions, investments), currency)}
        </p>
        <p className="text-xs text-slate-500">يُحدَّث من صفحة الاستثمار</p>
      </div>
    );
  }

  return (
    <p className="font-semibold text-slate-900">
      {formatCurrency(calculateWalletBalance(wallet, transactions, investments), currency)}
    </p>
  );
}

export default memo(WalletBalanceCellComponent);
