"use client";

import ExportTransactionsButton from "@/components/expenses/ExportTransactionsButton";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { OfflineTransaction } from "@/lib/offline/types";
import type { Wallet } from "@/lib/types/database";

type ExpensesToolbarProps = {
  transactions: OfflineTransaction[];
  wallets: Wallet[];
  currency: string;
  onAddTransaction: () => void;
  onAddRecurring: () => void;
};

export default function ExpensesToolbar({
  transactions,
  wallets,
  currency,
  onAddTransaction,
  onAddRecurring,
}: ExpensesToolbarProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onAddTransaction}
        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        + {t("expenses.addTransaction")}
      </button>
      <button
        type="button"
        onClick={onAddRecurring}
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
      >
        + {t("expenses.addRecurring")}
      </button>
      <ExportTransactionsButton
        transactions={transactions}
        wallets={wallets}
        currency={currency}
      />
    </div>
  );
}
