"use client";

import { FormEvent } from "react";
import ModalShell from "@/components/ui/ModalShell";
import WalletSelect from "@/components/wallets/WalletSelect";
import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import { recurringFrequencyOptions } from "@/lib/constants/recurring-options";
import type { Category, TransactionType, Wallet } from "@/lib/types/database";
import type { RecurringFormState } from "@/lib/recurring";

type RecurringTransactionFormModalProps = {
  form: RecurringFormState;
  wallets: Wallet[];
  categories: Category[];
  submitting: boolean;
  onChange: (form: RecurringFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export default function RecurringTransactionFormModal({
  form,
  wallets,
  categories,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: RecurringTransactionFormModalProps) {
  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">عملية متكررة جديدة</h2>
          <p className="mt-1 text-sm text-slate-500">
            إيجار، اشتراكات، راتب — سجّلها مرة وتذكّرك كل فترة.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          إغلاق
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">الاسم</span>
          <input
            type="text"
            required
            value={form.title}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
            placeholder="مثال: إيجار، Netflix، راتب"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">النوع</span>
          <select
            value={form.type}
            onChange={(event) =>
              onChange({ ...form, type: event.target.value as TransactionType })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="expense">مصروف</option>
            <option value="income">دخل</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المبلغ</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.amount}
            onChange={(event) => onChange({ ...form, amount: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المحفظة</span>
          <WalletSelect
            wallets={wallets}
            value={form.walletId}
            onChange={(walletId) => onChange({ ...form, walletId })}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            الفئة{form.type === "income" ? " (اختياري)" : ""}
          </span>
          <CategorySearchSelect
            categories={categories}
            value={form.categoryId}
            onChange={(categoryId) => onChange({ ...form, categoryId })}
            allowEmpty={form.type === "income"}
            required={form.type === "expense"}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus-within:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">التكرار</span>
          <select
            value={form.frequency}
            onChange={(event) =>
              onChange({
                ...form,
                frequency: event.target.value as RecurringFormState["frequency"],
              })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            {recurringFrequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">تاريخ البداية</span>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(event) => onChange({ ...form, startDate: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">تاريخ الانتهاء (اختياري)</span>
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => onChange({ ...form, endDate: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">ملاحظة</span>
          <input
            type="text"
            value={form.note}
            onChange={(event) => onChange({ ...form, note: event.target.value })}
            placeholder="اختياري"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            إلغاء
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
