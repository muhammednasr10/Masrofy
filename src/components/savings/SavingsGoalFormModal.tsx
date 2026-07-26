"use client";

import ModalShell from "@/components/ui/ModalShell";
import type { SavingsGoalFormState } from "@/lib/savings/form";
import { FormEvent } from "react";

type SavingsGoalFormModalProps = {
  title: string;
  form: SavingsGoalFormState;
  submitting: boolean;
  onChange: (next: SavingsGoalFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export default function SavingsGoalFormModal({
  title,
  form,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: SavingsGoalFormModalProps) {
  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          إغلاق
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[72px_1fr]">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">أيقونة</span>
            <input
              type="text"
              value={form.icon}
              onChange={(event) => onChange({ ...form, icon: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-center outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">اسم الهدف</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => onChange({ ...form, name: event.target.value })}
              placeholder="مثال: سيارة جديدة"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المبلغ المستهدف</span>
          <input
            type="number"
            min="1"
            step="0.01"
            required
            value={form.targetAmount}
            onChange={(event) => onChange({ ...form, targetAmount: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المبلغ المُوفَّر حالياً</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.currentAmount}
            onChange={(event) => onChange({ ...form, currentAmount: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">تاريخ الهدف</span>
          <input
            type="date"
            value={form.targetDate}
            onChange={(event) => onChange({ ...form, targetDate: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">ملاحظات</span>
          <input
            type="text"
            value={form.notes}
            onChange={(event) => onChange({ ...form, notes: event.target.value })}
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
            {submitting ? "جاري الحفظ..." : "حفظ الهدف"}
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
