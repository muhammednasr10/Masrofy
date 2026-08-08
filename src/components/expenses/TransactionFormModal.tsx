"use client";

import { FormEvent } from "react";
import ModalShell from "@/components/ui/ModalShell";
import TransactionForm from "@/components/expenses/TransactionForm";
import { useTranslations } from "@/components/i18n/LocaleProvider";
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
  onClose: () => void;
  onCategoryCreated?: (category: Category) => void;
};

export default function TransactionFormModal({
  open,
  mode = "add",
  onClose,
  submitting,
  ...formProps
}: TransactionFormModalProps) {
  const t = useTranslations();
  const formId = "transaction-form-modal";

  if (!open) {
    return null;
  }

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
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
          aria-label={t("common.close")}
        >
          ✕
        </button>
      </div>

      <div className="mt-6 pb-24 sm:pb-0">
        <TransactionForm
          {...formProps}
          formId={formId}
          mode={mode}
          submitting={submitting}
          showSubmit={false}
        />
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-slate-100 bg-white px-4 py-4 safe-bottom sm:mx-0 sm:hidden">
        <button
          type="submit"
          form={formId}
          disabled={submitting}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting
            ? t("expenses.formSaving")
            : mode === "edit"
              ? t("expenses.formSaveChanges")
              : t("expenses.formSave")}
        </button>
      </div>

      <button
        type="submit"
        form={formId}
        disabled={submitting}
        className="mt-6 hidden w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60 sm:block"
      >
        {submitting
          ? t("expenses.formSaving")
          : mode === "edit"
            ? t("expenses.formSaveChanges")
            : t("expenses.formSave")}
      </button>
    </ModalShell>
  );
}
