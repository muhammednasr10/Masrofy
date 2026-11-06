"use client";

import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import ModalShell from "@/components/ui/ModalShell";
import WalletSelect from "@/components/wallets/WalletSelect";
import type { DebtFormState } from "@/hooks/useDebtsPage";
import type { DebtDirection } from "@/lib/debts/balance";
import type { Category, Wallet } from "@/lib/types/database";
import { FormEvent } from "react";

const fieldClass =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500";

export default function DebtFormModal({
  title,
  form,
  categories,
  wallets,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: {
  title: string;
  form: DebtFormState;
  categories: Category[];
  wallets: Wallet[];
  submitting: boolean;
  onChange: (next: DebtFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <ModalShell onClose={onClose} dialog maxWidthClassName="sm:max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">
          إغلاق
        </button>
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">الجهة</span>
          <input
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            required
            placeholder="اسم الشخص أو الجهة"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">النوع</span>
          <select
            value={form.direction}
            onChange={(event) => onChange({ ...form, direction: event.target.value as DebtDirection })}
            className={fieldClass}
          >
            <option value="i_owe">عليّ</option>
            <option value="owed_to_me">لي</option>
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">أصل الدين</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.principal}
              onChange={(event) => onChange({ ...form, principal: event.target.value })}
              required
              className={fieldClass}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">تاريخ البداية</span>
            <input
              type="date"
              value={form.openedOn}
              onChange={(event) => onChange({ ...form, openedOn: event.target.value })}
              required
              className={fieldClass}
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">فئة القسط</span>
          <CategorySearchSelect
            categories={categories}
            value={form.categoryId}
            allowEmpty
            emptyLabel="من غير قسط"
            onChange={(categoryId) => onChange({ ...form, categoryId })}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المحفظة</span>
          <WalletSelect
            wallets={wallets}
            value={form.walletId}
            allowEmpty
            emptyLabel="المحفظة الافتراضية"
            onChange={(walletId) => onChange({ ...form, walletId })}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">ملاحظة</span>
          <textarea
            value={form.notes}
            onChange={(event) => onChange({ ...form, notes: event.target.value })}
            rows={2}
            className={fieldClass}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "جاري الحفظ..." : "حفظ"}
        </button>
      </form>
    </ModalShell>
  );
}
