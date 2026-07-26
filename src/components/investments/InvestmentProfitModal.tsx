"use client";

import ModalShell from "@/components/ui/ModalShell";
import type { Investment, InvestmentProfitEntry } from "@/lib/types/database";
import {
  emptyInvestmentProfitForm,
  formatProfitPeriod,
  type InvestmentProfitFormState,
} from "@/lib/investments/profit-entries";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export { emptyInvestmentProfitForm, type InvestmentProfitFormState };

type InvestmentProfitModalProps = {
  investment: Investment;
  entries: InvestmentProfitEntry[];
  currency: string;
  form: InvestmentProfitFormState;
  saving: boolean;
  onChange: (next: InvestmentProfitFormState) => void;
  onSubmit: () => void;
  onDeleteEntry: (entryId: string) => void;
  onClose: () => void;
};

export default function InvestmentProfitModal({
  investment,
  entries,
  currency,
  form,
  saving,
  onChange,
  onSubmit,
  onDeleteEntry,
  onClose,
}: InvestmentProfitModalProps) {
  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">تسجيل ربح أو خسارة</h2>
            <p className="mt-1 text-sm text-slate-500">
              {investment.icon} {investment.name} — سجّل كسبت أو خسرت قد إيه خلال فترة.
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
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">الربح / الخسارة</span>
            <input
              type="number"
              step="0.01"
              required
              value={form.profitAmount}
              onChange={(event) => onChange({ ...form, profitAmount: event.target.value })}
              placeholder="مثال: 150 أو -40"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-slate-500">استخدم رقم سالب لو فيه خسارة.</p>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">من (اختياري)</span>
              <input
                type="date"
                value={form.periodStart}
                onChange={(event) => onChange({ ...form, periodStart: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">إلى</span>
              <input
                type="date"
                required
                value={form.periodEnd}
                onChange={(event) => onChange({ ...form, periodEnd: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">ملاحظة (اختياري)</span>
            <input
              type="text"
              value={form.note}
              onChange={(event) => onChange({ ...form, note: event.target.value })}
              placeholder="مثال: أرباح تداول يناير"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
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

        {entries.length > 0 ? (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-medium text-slate-700">سجل الأرباح</h3>
            <ul className="mt-4 space-y-3">
              {entries.map((entry) => {
                const amount = Number(entry.profit_amount);
                const tone = amount >= 0 ? "text-emerald-700" : "text-red-600";

                return (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className={`font-semibold ${tone}`}>
                        {amount >= 0 ? "+" : ""}
                        {formatCurrency(amount, currency)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatProfitPeriod(entry)}
                        {entry.note ? ` • ${entry.note}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(entry.created_at.slice(0, 10))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      className="rounded-full px-3 py-1 text-xs text-slate-500 transition hover:bg-white hover:text-red-600"
                    >
                      حذف
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
    </ModalShell>
  );
}
