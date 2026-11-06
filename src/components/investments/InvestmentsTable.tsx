"use client";

import InvestmentMobileCard from "@/components/investments/InvestmentMobileCard";
import InvestmentTableRow from "@/components/investments/InvestmentTableRow";
import type { InvestmentRow, InvestmentRowHandlers } from "@/components/investments/investment-row";
import type { InvestmentProfitEntry } from "@/lib/types/database";

type InvestmentsTableProps = {
  rows: InvestmentRow[];
  currency: string;
  profitEntriesByInvestment: Record<string, InvestmentProfitEntry[]>;
  reorderingId: string | null;
  onMoveInvestment: (investmentId: string, direction: "up" | "down") => void;
} & InvestmentRowHandlers;

export default function InvestmentsTable({
  rows,
  currency,
  profitEntriesByInvestment,
  reorderingId,
  onMoveInvestment,
  onEditInvestment,
  onLogProfit,
  onUpdateValue,
  onViewHistory,
  onDeleteInvestment,
}: InvestmentsTableProps) {
  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">ابدأ بإضافة أول استثمار.</p>;
  }

  const sharedProps = {
    currency,
    profitEntriesByInvestment,
    reorderingId,
    onMoveInvestment,
    onEditInvestment,
    onLogProfit,
    onUpdateValue,
    onViewHistory,
    onDeleteInvestment,
  };

  return (
    <>
      <div className="mt-4 space-y-3 md:hidden">
        {rows.map((row, index) => (
          <InvestmentMobileCard
            key={row.investment.id}
            row={row}
            index={index}
            totalRows={rows.length}
            {...sharedProps}
          />
        ))}
      </div>

      <div className="mt-4 hidden x-scroll md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-3 text-right font-medium">الترتيب</th>
              <th className="px-3 py-3 text-right font-medium">الاستثمار</th>
              <th className="px-3 py-3 text-right font-medium">النوع</th>
              <th className="px-3 py-3 text-right font-medium">المستثمر</th>
              <th className="px-3 py-3 text-right font-medium">الحالي / المتوقع</th>
              <th className="px-3 py-3 text-right font-medium">ميعاد القبض</th>
              <th className="px-3 py-3 text-right font-medium">الربح/الخسارة</th>
              <th className="px-3 py-3 text-right font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <InvestmentTableRow
                key={row.investment.id}
                row={row}
                index={index}
                totalRows={rows.length}
                currency={currency}
                profitEntries={profitEntriesByInvestment[row.investment.id] ?? []}
                reorderingId={reorderingId}
                onMoveInvestment={onMoveInvestment}
                onEditInvestment={onEditInvestment}
                onLogProfit={onLogProfit}
                onUpdateValue={onUpdateValue}
                onViewHistory={onViewHistory}
                onDeleteInvestment={onDeleteInvestment}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
