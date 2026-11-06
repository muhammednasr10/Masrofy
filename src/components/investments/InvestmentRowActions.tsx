import IconActionButton from "@/components/ui/IconActionButton";
import type { InvestmentRowHandlers } from "@/components/investments/investment-row";
import type { Investment } from "@/lib/types/database";

export default function InvestmentRowActions({
  investment,
  onEditInvestment,
  onLogProfit,
  onUpdateValue,
  onViewHistory,
  onDeleteInvestment,
}: {
  investment: Investment;
} & InvestmentRowHandlers) {
  return (
    <div className="flex items-center gap-1">
      <IconActionButton
        icon="🕘"
        label="سجل القيمة"
        onClick={() => onViewHistory(investment)}
        tone="slate"
      />
      {!investment.is_fixed_return ? (
        <>
          <IconActionButton
            icon="📈"
            label="تحديث القيمة"
            onClick={() => onUpdateValue(investment)}
            tone="slate"
          />
          <IconActionButton
            icon="💰"
            label="تسجيل ربح"
            onClick={() => onLogProfit(investment)}
            tone="slate"
          />
        </>
      ) : null}
      <IconActionButton
        icon="✏️"
        label="تعديل"
        onClick={() => onEditInvestment(investment)}
        tone="slate"
      />
      <IconActionButton
        icon="🗑️"
        label="حذف"
        onClick={() => onDeleteInvestment(investment.id)}
        tone="red"
      />
    </div>
  );
}
