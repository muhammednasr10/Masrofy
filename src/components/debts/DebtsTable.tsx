"use client";

import type { DebtRow } from "@/hooks/useDebtsPage";
import type { Category } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";

export default function DebtsTable({
  rows,
  categories,
  currency,
  onEdit,
  onPayment,
  onDelete,
}: {
  rows: DebtRow[];
  categories: Category[];
  currency: string;
  onEdit: (debt: DebtRow) => void;
  onPayment: (debt: DebtRow) => void;
  onDelete: (debtId: string) => void;
}) {
  const names = new Map(categories.map((category) => [category.id, category.name]));

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        مفيش ديون لسه. أضف الدين، ولو له قسط اربطه بفئته.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="px-2 py-3 text-center font-medium">الجهة</th>
            <th className="px-2 py-3 text-center font-medium">النوع</th>
            <th className="px-2 py-3 text-center font-medium">الأصل</th>
            <th className="px-2 py-3 text-center font-medium">المدفوع</th>
            <th className="px-2 py-3 text-center font-medium">مجدول</th>
            <th className="px-2 py-3 text-center font-medium">الباقي</th>
            <th className="px-2 py-3 text-center font-medium">القسط</th>
            <th className="px-2 py-3 text-center font-medium">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((debt) => {
            const settled = debt.remaining <= 0;

            return (
              <tr key={debt.id} className="border-b border-slate-100 last:border-0">
                <td className="px-2 py-3 text-center font-medium text-slate-900">{debt.name}</td>
                <td className="px-2 py-3 text-center">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      debt.direction === "i_owe" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {debt.direction === "i_owe" ? "عليّ" : "لي"}
                  </span>
                </td>
                <td className="px-2 py-3 text-center">{formatCurrency(Number(debt.principal), currency)}</td>
                <td className="px-2 py-3 text-center">{formatCurrency(debt.paid, currency)}</td>
                <td className="px-2 py-3 text-center text-slate-500">
                  {debt.scheduled > 0 ? formatCurrency(debt.scheduled, currency) : "—"}
                </td>
                <td className={`px-2 py-3 text-center font-semibold ${settled ? "text-emerald-700" : "text-slate-900"}`}>
                  {settled ? "خلّص" : formatCurrency(debt.remaining, currency)}
                </td>
                <td className="px-2 py-3 text-center text-slate-600">
                  {debt.category_id ? names.get(debt.category_id) ?? "—" : "—"}
                </td>
                <td className="px-2 py-3 text-center">
                  <div className="flex flex-wrap justify-center gap-2">
                    {settled ? null : (
                      <button
                        type="button"
                        onClick={() => onPayment(debt)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        دفعة
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(debt)}
                      className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(debt.id)}
                      className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
