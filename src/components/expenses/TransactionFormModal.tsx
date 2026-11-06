"use client";

import { FormEvent } from "react";
import ModalShell from "@/components/ui/ModalShell";
import TransactionBatchForm from "@/components/expenses/TransactionBatchForm";
import TransactionForm from "@/components/expenses/TransactionForm";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { ReadyTransactionDraft } from "@/lib/expenses/batch-draft";
import type { Category, TransactionType, Wallet } from "@/lib/types/database";
import type { getSelectedWalletSnapshot } from "@/lib/expenses/display";

type WalletSnapshot = ReturnType<typeof getSelectedWalletSnapshot>;

type TransactionFormModalProps = {
  open: boolean;
  mode?: "add" | "edit";
  categories: Category[];
  wallets: Wallet[];
  currency: string;
  amount: string;
  categoryId: string;
  walletId: string;
  type: TransactionType;
  note: string;
  transactionDate: string;
  receiptFile: File | null;
  submitting: boolean;
  selectedWalletSnapshot: WalletSnapshot;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onWalletChange: (value: string) => void;
  onTypeChange: (value: TransactionType) => void;
  onNoteChange: (value: string) => void;
  onReceiptChange: (file: File | null) => void;
  onTransactionDateChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSaveLines?: (lines: ReadyTransactionDraft[]) => void;
  onClose: () => void;
  onCategoryCreated?: (category: Category) => void;
};

export default function TransactionFormModal({
  open,
  mode = "add",
  onClose,
  onSaveLines,
  submitting,
  ...formProps
}: TransactionFormModalProps) {
  const t = useTranslations();

  if (!open) {
    return null;
  }

  return (
    <ModalShell
      onClose={onClose}
      dialog
      maxWidthClassName={mode === "edit" ? "max-w-lg" : "max-w-3xl"}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-slate-900">
            {mode === "edit" ? t("expenses.editModalTitle") : t("expenses.addModalTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "edit" ? t("expenses.editModalSubtitle") : t("expenses.addModalSubtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          {t("common.close")}
        </button>
      </div>

      <div className="mt-6">
        {mode === "edit" || !onSaveLines ? (
          <TransactionForm {...formProps} mode={mode} submitting={submitting} />
        ) : (
          <TransactionBatchForm
            categories={formProps.categories}
            wallets={formProps.wallets}
            currency={formProps.currency}
            walletId={formProps.walletId}
            transactionDate={formProps.transactionDate}
            receiptFile={formProps.receiptFile}
            submitting={submitting}
            selectedWalletSnapshot={formProps.selectedWalletSnapshot}
            onWalletChange={formProps.onWalletChange}
            onTransactionDateChange={formProps.onTransactionDateChange}
            onReceiptChange={formProps.onReceiptChange}
            onCategoryCreated={formProps.onCategoryCreated}
            onSave={onSaveLines}
          />
        )}
      </div>
    </ModalShell>
  );
}
