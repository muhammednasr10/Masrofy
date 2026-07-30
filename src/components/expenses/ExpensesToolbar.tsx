"use client";

import { useState } from "react";
import ExportTransactionsButton from "@/components/expenses/ExportTransactionsButton";
import ImportTransactionsModal from "@/components/expenses/ImportTransactionsModal";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { ParsedImportRow } from "@/lib/expenses/import-csv";
import type { OfflineTransaction } from "@/lib/offline/types";
import type { Wallet } from "@/lib/types/database";

type ExpensesToolbarProps = {
  transactions: OfflineTransaction[];
  wallets: Wallet[];
  currency: string;
  submitting: boolean;
  onAddTransaction: () => void;
  onAddRecurring: () => void;
  onImport: (rows: ParsedImportRow[], walletId: string) => Promise<void>;
};

export default function ExpensesToolbar({
  transactions,
  wallets,
  currency,
  submitting,
  onAddTransaction,
  onAddRecurring,
  onImport,
}: ExpensesToolbarProps) {
  const t = useTranslations();
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <>
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
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ⬆ {t("expenses.importCsv")}
        </button>
        <ExportTransactionsButton
          transactions={transactions}
          wallets={wallets}
          currency={currency}
        />
      </div>

      <ImportTransactionsModal
        open={showImportModal}
        wallets={wallets}
        currency={currency}
        submitting={submitting}
        onClose={() => setShowImportModal(false)}
        onImport={onImport}
      />
    </>
  );
}
