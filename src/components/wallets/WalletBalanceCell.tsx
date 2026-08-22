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
  /** List/table view: same font size as surrounding text */
  compact?: boolean;
};

const listAmountClass = "amount-inline text-slate-900";
const detailAmountClass = "amount-text text-slate-900";

function WalletBalanceCellComponent({
  wallet,
  transactions,
  investments = [],
  currency,
  aggregatedSummary = null,
  compact = false,
}: WalletBalanceCellProps) {
  const amountClass = compact ? listAmountClass : detailAmountClass;

  if (aggregatedSummary) {
    return (
      <div className={compact ? "text-end" : "space-y-1"}>
        <p className={amountClass}>
          {formatCurrency(aggregatedSummary.assetTotal, currency)}
        </p>
        {!compact ? (
          <>
            <p className="wrap-text text-sm leading-6 text-slate-500">
              مجموع المحافظ الفرعية (بدون كريديت)
            </p>
            {aggregatedSummary.creditNotes.map((note) => (
              <p key={note.walletName} className="wrap-text text-sm leading-6 text-amber-700">
                ملاحظة: {note.walletName} — مستحق {formatCurrency(note.owed, currency)}
                {note.limit != null
                  ? ` • متاح ${formatCurrency(note.available ?? 0, currency)}`
                  : ""}
              </p>
            ))}
          </>
        ) : null}
      </div>
    );
  }

  if (isCreditWallet(wallet)) {
    const owed = getCreditOwed(wallet, transactions);
    const available = getCreditAvailable(wallet, transactions);

    return (
      <div className={compact ? "text-end" : "space-y-1"}>
        <p className={`wrap-text ${compact ? "amount-inline text-red-600" : "font-semibold text-red-600"}`}>
          مستحق: {formatCurrency(owed, currency)}
        </p>
        {!compact && wallet.credit_limit != null ? (
          <>
            <p className="wrap-text text-sm text-slate-500">
              الحد: {formatCurrency(Number(wallet.credit_limit), currency)}
            </p>
            {available != null ? (
              <p className="wrap-text text-sm text-emerald-700">
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
      <div className={compact ? "text-end" : "space-y-1"}>
        <p className={amountClass}>
          {formatCurrency(calculateWalletBalance(wallet, transactions, investments), currency)}
        </p>
        {!compact ? <p className="text-sm text-slate-500">يُحدَّث من صفحة الاستثمار</p> : null}
      </div>
    );
  }

  return (
    <p className={`${amountClass}${compact ? " text-end" : ""}`}>
      {formatCurrency(calculateWalletBalance(wallet, transactions, investments), currency)}
    </p>
  );
}

export default memo(WalletBalanceCellComponent);
