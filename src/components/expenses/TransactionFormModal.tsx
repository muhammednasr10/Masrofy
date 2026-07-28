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
  onClose,
  ...formProps
}: TransactionFormModalProps) {
  const t = useTranslations();

  if (!open) {
    return null;
  }

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("expenses.addModalTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("expenses.addModalSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
          aria-label={t("common.close")}
        >
          ✕
        </button>
      </div>

      <div className="mt-6">
        <TransactionForm {...formProps} />
      </div>
    </ModalShell>
  );
}
