import { memo } from "react";
import InvestmentRowActions from "@/components/investments/InvestmentRowActions";
import InvestmentRowContent from "@/components/investments/InvestmentRowContent";
import type { InvestmentRow, InvestmentRowHandlers } from "@/components/investments/investment-row";
import ReorderButton from "@/components/ui/ReorderButton";
import type { InvestmentProfitEntry } from "@/lib/types/database";

const InvestmentMobileCard = memo(function InvestmentMobileCard({
  row,
  index,
  totalRows,
  currency,
  profitEntriesByInvestment,
  reorderingId,
  onMoveInvestment,
  onEditInvestment,
  onLogProfit,
  onUpdateValue,
  onViewHistory,
  onDeleteInvestment,
}: {
  row: InvestmentRow;
  index: number;
  totalRows: number;
  currency: string;
  profitEntriesByInvestment: Record<string, InvestmentProfitEntry[]>;
  reorderingId: string | null;
  onMoveInvestment: (investmentId: string, direction: "up" | "down") => void;
} & InvestmentRowHandlers) {
  const profitEntries = profitEntriesByInvestment[row.investment.id] ?? [];

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <InvestmentRowContent row={row} currency={currency} profitEntries={profitEntries} compact />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1">
          <ReorderButton
            direction="up"
            disabled={index === 0 || reorderingId === row.investment.id}
            onClick={() => onMoveInvestment(row.investment.id, "up")}
          />
          <ReorderButton
            direction="down"
            disabled={index === totalRows - 1 || reorderingId === row.investment.id}
            onClick={() => onMoveInvestment(row.investment.id, "down")}
          />
        </div>

        <InvestmentRowActions
          investment={row.investment}
          onEditInvestment={onEditInvestment}
          onLogProfit={onLogProfit}
          onUpdateValue={onUpdateValue}
          onViewHistory={onViewHistory}
          onDeleteInvestment={onDeleteInvestment}
        />
      </div>
    </article>
  );
});

export default InvestmentMobileCard;
