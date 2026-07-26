"use client";

import type { Investment } from "@/lib/types/database";
import ModalShell from "@/components/ui/ModalShell";
import { formatCurrency } from "@/lib/utils/format";

export type InvestmentValueFormState = {
  currentValue: string;
  note: string;
};

export function emptyInvestmentValueForm(investment: Investment): InvestmentValueFormState {
  return {
    currentValue: String(investment.current_value),
    note: "",
  };
}

type InvestmentValueModalProps = {
  investment: Investment;
  currency: string;
  form: InvestmentValueFormState;
  saving: boolean;
  onChange: (next: InvestmentValueFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function InvestmentValueModal({
  investment,
  currency,
  form,
  saving,
  onChange,
  onSubmit,
  onClose,
}: InvestmentValueModalProps) {
  const nextProfit =
    form.currentValue.trim() && !Number.isNaN(Number(form.currentValue))
      ? Number(form.currentValue) - Number(investment.cost_basis)
      : null;

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">تحديث القيمة الحالية</h2>
            <p className="mt-1 text-sm text-slate-500">
              {investment.icon} {investment.name} — قول بس المبلغ بقى كام دلوقتي.
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="mt-6 space-y-4"
        >
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            المستثمر: {formatCurrency(Number(investment.cost_basis), currency)}
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">القيمة الحالية</span>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.currentValue}
              onChange={(event) => onChange({ ...form, currentValue: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          {nextProfit != null ? (
            <p
              className={`text-sm font-medium ${
                nextProfit >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              الربح/الخسارة الإجمالية: {nextProfit >= 0 ? "+" : ""}
              {formatCurrency(nextProfit, currency)}
            </p>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">ملاحظة (اختياري)</span>
            <input
              type="text"
              value={form.note}
              onChange={(event) => onChange({ ...form, note: event.target.value })}
              placeholder="مثال: بعد مراجعة محفظة بينانس"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ القيمة"}
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
