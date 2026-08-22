"use client";

import { useMemo } from "react";
import type { Investment, InvestmentProfitEntry, InvestmentUpdate } from "@/lib/types/database";
import { summarizeInvestments } from "@/lib/investments";

export function useInvestmentsDerivedData(
  investments: Investment[],
  profitEntriesByInvestment: Record<string, InvestmentProfitEntry[]>,
  valueUpdatesByInvestment: Record<string, InvestmentUpdate[]>,
  profitInvestmentId: string | null,
  valueInvestmentId: string | null,
  historyInvestmentId: string | null,
) {
  const summary = useMemo(() => summarizeInvestments(investments), [investments]);

  const profitInvestment = useMemo(
    () => investments.find((investment) => investment.id === profitInvestmentId) ?? null,
    [investments, profitInvestmentId],
  );

  const valueInvestment = useMemo(
    () => investments.find((investment) => investment.id === valueInvestmentId) ?? null,
    [investments, valueInvestmentId],
  );

  const historyInvestment = useMemo(
    () => investments.find((investment) => investment.id === historyInvestmentId) ?? null,
    [investments, historyInvestmentId],
  );

  const historyUpdates = useMemo(
    () => (historyInvestmentId ? (valueUpdatesByInvestment[historyInvestmentId] ?? []) : []),
    [historyInvestmentId, valueUpdatesByInvestment],
  );

  const profitEntries = useMemo(
    () => (profitInvestmentId ? (profitEntriesByInvestment[profitInvestmentId] ?? []) : []),
    [profitEntriesByInvestment, profitInvestmentId],
  );

  return {
    summary,
    profitInvestment,
    valueInvestment,
    historyInvestment,
    historyUpdates,
    profitEntries,
  };
}
