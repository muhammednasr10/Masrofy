"use client";

import Link from "@/components/router/Link";
import { FormEvent, useRef, useState } from "react";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import SelectedWalletPanel from "@/components/expenses/SelectedWalletPanel";
import WalletSelect from "@/components/wallets/WalletSelect";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useCategoryForm } from "@/hooks/useCategoryForm";
import {
  createTransactionDraftLine,
  parseTransactionDrafts,
  type ReadyTransactionDraft,
  type TransactionDraftLine,
} from "@/lib/expenses/batch-draft";
import type { getSelectedWalletSnapshot } from "@/lib/expenses/display";
import type { Category } from "@/lib/types/database";
import type { Wallet } from "@/lib/types/database";

type WalletSnapshot = ReturnType<typeof getSelectedWalletSnapshot>;

type TransactionBatchFormProps = {
  categories: Category[];
  wallets: Wallet[];
  currency: string;
  walletId: string;
  transactionDate: string;
  receiptFile: File | null;
  submitting: boolean;
  selectedWalletSnapshot: WalletSnapshot;
  onWalletChange: (value: string) => void;
  onTransactionDateChange: (value: string) => void;
  onReceiptChange: (file: File | null) => void;
  onCategoryCreated?: (category: Category) => void;
  onSave: (lines: ReadyTransactionDraft[]) => void;
};

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500";

function FlowArrow({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d={direction === "down" ? "M8 3v10M4.5 9.5 8 13l3.5-3.5" : "M8 13V3M4.5 6.5 8 3l3.5 3.5"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TransactionBatchForm({
  categories,
  wallets,
  currency,
  walletId,
  transactionDate,
  receiptFile,
  submitting,
  selectedWalletSnapshot,
  onWalletChange,
  onTransactionDateChange,
  onReceiptChange,
  onCategoryCreated,
  onSave,
}: TransactionBatchFormProps) {
  const t = useTranslations();
  const [lines, setLines] = useState<TransactionDraftLine[]>(() => [createTransactionDraftLine()]);
  const [focusLineId, setFocusLineId] = useState<string | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const amountRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const categoryForm = useCategoryForm(categories, (category) => {
    onCategoryCreated?.(category);
    setLines((current) =>
      current.map((line) =>
        line.id === activeLineId ? { ...line, categoryId: category.id } : line,
      ),
    );
  });

  const readyCount = parseTransactionDrafts(lines).lines.length;

  function updateLine(lineId: string, patch: Partial<TransactionDraftLine>) {
    setLines((current) =>
      current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)),
    );
  }

  function addLine(afterId?: string) {
    const source = lines.find((line) => line.id === afterId);
    const next = createTransactionDraftLine(source?.type ?? "expense");
    setFocusLineId(next.id);
    setLines((current) => {
      if (!afterId) {
        return [...current, next];
      }

      const index = current.findIndex((line) => line.id === afterId);
      if (index === -1) {
        return [...current, next];
      }

      return [...current.slice(0, index + 1), next, ...current.slice(index + 1)];
    });
  }

  function removeLine(lineId: string) {
    setLines((current) =>
      current.length === 1 ? current : current.filter((line) => line.id !== lineId),
    );
  }

  function focusAmount(lineId: string) {
    window.requestAnimationFrame(() => amountRefs.current[lineId]?.focus());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseTransactionDrafts(lines);

    if (parsed.error) {
      setFormError(parsed.error);
      return;
    }

    setFormError(null);
    onSave(parsed.lines);
  }

  if (wallets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
        <p>{t("expenses.needWallet")}</p>
        <Link href="/wallets" className="mt-3 inline-block font-medium text-emerald-700">
          {t("expenses.manageWallets")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="compact-fields space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">{t("expenses.formWallet")}</span>
            <WalletSelect
              wallets={wallets}
              value={walletId}
              onChange={onWalletChange}
              required
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">{t("expenses.formDate")}</span>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(event) => onTransactionDateChange(event.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <SelectedWalletPanel snapshot={selectedWalletSnapshot} type="expense" currency={currency} />

        <div className="space-y-2">
          {lines.map((line, index) => (
            <div key={line.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex shrink-0 rounded-xl bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => updateLine(line.id, { type: "expense" })}
                    aria-pressed={line.type === "expense"}
                    aria-label={t("expenses.typeExpense")}
                    title={t("expenses.typeExpense")}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      line.type === "expense"
                        ? "bg-red-100 text-red-600"
                        : "text-red-300 hover:bg-red-50 hover:text-red-500"
                    }`}
                  >
                    <FlowArrow direction="down" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLine(line.id, { type: "income" })}
                    aria-pressed={line.type === "income"}
                    aria-label={t("expenses.typeIncome")}
                    title={t("expenses.typeIncome")}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      line.type === "income"
                        ? "bg-emerald-100 text-emerald-600"
                        : "text-emerald-300 hover:bg-emerald-50 hover:text-emerald-500"
                    }`}
                  >
                    <FlowArrow direction="up" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <CategorySearchSelect
                    categories={categories}
                    value={line.categoryId}
                    onChange={(categoryId) => updateLine(line.id, { categoryId })}
                    onPicked={() => {
                      setFocusLineId(null);
                      focusAmount(line.id);
                    }}
                    autoFocus={focusLineId === line.id}
                    allowEmpty
                    listInFlow
                    placeholder={t("expenses.formCategory")}
                    className={fieldClass}
                    onCreateNew={(name) => {
                      setActiveLineId(line.id);
                      categoryForm.openForm(null, name);
                    }}
                  />
                </div>
                <input
                  ref={(node) => {
                    amountRefs.current[line.id] = node;
                  }}
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={line.amount}
                  placeholder={t("expenses.formAmount")}
                  aria-label={`${t("expenses.formAmount")} ${index + 1}`}
                  onChange={(event) => updateLine(line.id, { amount: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addLine(line.id);
                    }
                  }}
                  className="w-[4.75rem] shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-emerald-500 sm:w-24 sm:px-3"
                />
                <input
                  type="text"
                  value={line.note}
                  placeholder={t("expenses.formNoteOptional")}
                  aria-label={t("expenses.formNote")}
                  onChange={(event) => updateLine(line.id, { note: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addLine(line.id);
                    }
                  }}
                  className="w-[4.75rem] shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-emerald-500 sm:w-36 sm:px-3"
                />
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={t("expenses.removeLine")}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => addLine(lines[lines.length - 1]?.id)}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            + {t("expenses.addLine")}
          </button>
          <p className="min-w-0 truncate text-xs text-slate-400">{t("expenses.batchEnterHint")}</p>
        </div>

        {readyCount <= 1 ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">{t("expenses.formReceipt")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={(event) => onReceiptChange(event.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none file:me-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700"
            />
            {receiptFile ? <span className="block text-xs text-slate-500">{receiptFile.name}</span> : null}
          </label>
        ) : null}

        {formError ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting
            ? t("expenses.formSaving")
            : readyCount > 1
              ? t("expenses.formSaveMany", { count: readyCount })
              : t("expenses.formSave")}
        </button>
      </form>

      {categoryForm.form ? (
        <CategoryFormModal
          form={categoryForm.form}
          categories={categories}
          submitting={categoryForm.submitting}
          error={categoryForm.error}
          onChange={categoryForm.setForm}
          onSubmit={categoryForm.handleSubmit}
          onClose={categoryForm.closeForm}
          zIndexClassName="z-[100]"
          compact
        />
      ) : null}
    </>
  );
}
