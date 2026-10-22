import { formatCurrency } from "@/lib/utils/format";
import type { PlanComparisonChildRow as PlanComparisonChild } from "@/lib/types/database";

export function PlanComparisonChildRow({
  child,
  parentActual,
  currency,
}: {
  child: PlanComparisonChild;
  parentActual: number;
  currency: string;
}) {
  const share =
    parentActual > 0 && child.actual > 0
      ? `${Math.round((child.actual / parentActual) * 100)}%`
      : "—";

  return (
    <tr className="border-b border-slate-100 bg-slate-50 last:border-0">
      <td data-span className="px-4 py-3 ps-6 text-slate-700 md:ps-14">
        <span className="flex items-center gap-2">
          <span>{child.icon}</span>
          {child.name}
        </span>
      </td>
      <td data-label="المخطط" className="px-4 py-3 text-slate-500">
        {child.planned > 0 ? formatCurrency(child.planned, currency) : "—"}
      </td>
      <td data-label="الواقع" className="px-4 py-3 font-medium text-slate-800">
        {formatCurrency(child.actual, currency)}
      </td>
      <td data-label="الفرق" className="px-4 py-3 text-slate-400">—</td>
      <td data-label="التقدم" className="px-4 py-3 text-slate-500">{share}</td>
    </tr>
  );
}
