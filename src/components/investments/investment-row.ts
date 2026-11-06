import type { CollectionStatus } from "@/lib/investments/utils";
import type { Investment } from "@/lib/types/database";

export type InvestmentRow = {
  investment: Investment;
  profit: number;
  returnPercent: number | null;
  collectionStatus: CollectionStatus | null;
  daysUntilCollection: number | null;
  displayValue: number;
};

export type InvestmentRowHandlers = {
  onEditInvestment: (investment: Investment) => void;
  onLogProfit: (investment: Investment) => void;
  onUpdateValue: (investment: Investment) => void;
  onViewHistory: (investment: Investment) => void;
  onDeleteInvestment: (investmentId: string) => void;
};
