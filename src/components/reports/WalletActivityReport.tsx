import type { WalletActivityRow } from "@/lib/reports";
import { formatCurrency } from "@/lib/utils/format";

export default function WalletActivityReport({
  rows,
  currency,
}: {
  rows: WalletActivityRow[];
  currency: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">لا توجد عمليات في هذه الفترة.</p>;
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article
            key={row.walletId ?? "none"}
            className="rounded-2xl border border-slate-100 p-4"
            style={{ backgroundColor: `${row.color}08` }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                style={{ backgroundColor: `${row.color}20` }}
              >
                {row.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{row.name}</p>
                <p className="text-xs text-slate-500">{row.transactionCount} عملية</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-red-600">مصروفات</p>
                <p className="font-medium text-slate-900">{formatCurrency(row.expenses, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-700">دخل</p>
                <p className="font-medium text-slate-900">{formatCurrency(row.income, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">الصافي</p>
                <p className={`font-semibold ${row.net >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {formatCurrency(row.net, currency)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-3 text-right font-medium">المحفظة</th>
              <th className="px-3 py-3 text-right font-medium">مصروفات</th>
              <th className="px-3 py-3 text-right font-medium">دخل</th>
              <th className="px-3 py-3 text-right font-medium">الصافي</th>
              <th className="px-3 py-3 text-right font-medium">العمليات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.walletId ?? "none"} className="border-b border-slate-100">
                <td className="px-3 py-4">
                  <span className="flex items-center gap-2 font-medium text-slate-900">
                    <span>{row.icon}</span>
                    {row.name}
                  </span>
                </td>
                <td className="px-3 py-4 text-red-600">{formatCurrency(row.expenses, currency)}</td>
                <td className="px-3 py-4 text-emerald-700">{formatCurrency(row.income, currency)}</td>
                <td
                  className={`px-3 py-4 font-semibold ${
                    row.net >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {formatCurrency(row.net, currency)}
                </td>
                <td className="px-3 py-4 text-slate-600">{row.transactionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
