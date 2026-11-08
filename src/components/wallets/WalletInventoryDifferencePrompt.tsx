"use client";

import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { DifferenceClassification } from "@/hooks/useWalletInventory";
import { isExpenseCategory, isIncomeCategory } from "@/lib/categories/flow";
import type { Category } from "@/lib/types/database";
import type { BalanceDifferenceKind } from "@/lib/wallets/reconciliation-labels";

export default function WalletInventoryDifferencePrompt({
  kind,
  classification,
  categoryId,
  categories,
  onClassificationChange,
  onCategoryChange,
}: {
  kind: BalanceDifferenceKind;
  classification: DifferenceClassification;
  categoryId: string;
  categories: Category[];
  onClassificationChange: (value: DifferenceClassification) => void;
  onCategoryChange: (categoryId: string) => void;
}) {
  const t = useTranslations();
  const scopedCategories = categories.filter((category) =>
    kind === "income" ? isIncomeCategory(category) : isExpenseCategory(category),
  );
  const unknownLabel =
    kind === "income" ? t("wallets.inventoryUnknownIncome") : t("wallets.inventoryUnknownExpense");
  const knownLabel =
    kind === "income" ? t("wallets.inventoryKnownIncome") : t("wallets.inventoryKnownExpense");
  const question =
    kind === "income" ? t("wallets.inventoryIncomeQuestion") : t("wallets.inventoryExpenseQuestion");

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
      <p className="text-sm font-medium text-amber-950">{question}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onClassificationChange("unknown")}
          className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            classification === "unknown"
              ? "bg-amber-700 text-white"
              : "bg-white text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
          }`}
        >
          {unknownLabel}
        </button>
        <button
          type="button"
          onClick={() => onClassificationChange("known")}
          className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            classification === "known"
              ? "bg-emerald-700 text-white"
              : "bg-white text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-50"
          }`}
        >
          {knownLabel}
        </button>
      </div>
      {classification === "known" ? (
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            {kind === "income" ? t("wallets.inventoryPickIncomeCategory") : t("wallets.inventoryPickExpenseCategory")}
          </span>
          <CategorySearchSelect
            categories={scopedCategories}
            value={categoryId}
            onChange={onCategoryChange}
            required
            listInFlow
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus-within:border-emerald-500"
          />
        </div>
      ) : null}
    </div>
  );
}
