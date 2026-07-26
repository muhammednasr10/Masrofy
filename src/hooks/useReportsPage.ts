"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  buildMonthlyTrend,
  buildYearlyOverview,
  filterTransactionsForMonth,
  getRecentMonthKeys,
  summarizeTransactionsByWallet,
} from "@/lib/reports";
import {
  buildPlanComparison,
  getMonthStartFromPlanMonthKey,
  getPlanMonthKey,
  getPlanYear,
  parsePlanMonthKey,
} from "@/lib/plan";
import { summarizeInvestments } from "@/lib/investments/utils";
import type {
  Category,
  Investment,
  InvestmentProfitEntry,
  MonthlyPlan,
  PlanItem,
  Transaction,
  Wallet,
  WalletReconciliation,
} from "@/lib/types/database";
import { getMonthRange } from "@/lib/utils/format";
import { summarizeTransactions } from "@/lib/utils/summary";
import {
  summarizePortfolioWealth,
  summarizeWalletBalances,
} from "@/lib/wallets";

export function useReportsPage() {
  const [planMonthKey, setPlanMonthKey] = useState(() => getPlanMonthKey());
  const [currency, setCurrency] = useState("EGP");
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [profitEntries, setProfitEntries] = useState<InvestmentProfitEntry[]>([]);
  const [yearTransactions, setYearTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [reconciliations, setReconciliations] = useState<WalletReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const referenceDate = useMemo(() => parsePlanMonthKey(planMonthKey), [planMonthKey]);
  const month = useMemo(() => getMonthRange(referenceDate), [referenceDate]);
  const planYear = useMemo(() => getPlanYear(planMonthKey), [planMonthKey]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const yearStart = `${planYear}-01-01`;
    const yearEnd = `${planYear}-12-31`;

    const [
      { data: profile },
      { data: categoryRows },
      { data: walletRows },
      { data: investmentRows },
      { data: profitEntryRows },
      { data: yearTransactionRows },
      { data: balanceTransactionRows },
      { data: reconciliationRows },
      { data: planRow, error: planError },
    ] = await Promise.all([
      supabase.from("profiles").select("currency").maybeSingle(),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
      supabase.from("investments").select("*").order("sort_order", { ascending: true }),
      supabase.from("investment_profit_entries").select("*").order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("*, categories(name, icon, color), wallets(name, icon, color)")
        .gte("transaction_date", yearStart)
        .lte("transaction_date", yearEnd)
        .order("transaction_date", { ascending: false }),
      supabase.from("transactions").select("id, wallet_id, amount, type"),
      supabase
        .from("wallet_reconciliations")
        .select("*, wallets(name, icon, color)")
        .order("reconciled_at", { ascending: false })
        .limit(50),
      supabase
        .from("monthly_plans")
        .select("*")
        .eq("plan_month", getMonthStartFromPlanMonthKey(planMonthKey))
        .maybeSingle(),
    ]);

    if (planError) {
      setError(planError.message);
    }

    setCurrency(profile?.currency ?? "EGP");
    setCategories((categoryRows ?? []) as Category[]);
    setWallets((walletRows ?? []) as Wallet[]);
    setInvestments((investmentRows ?? []) as Investment[]);
    setProfitEntries((profitEntryRows ?? []) as InvestmentProfitEntry[]);
    setYearTransactions((yearTransactionRows ?? []) as Transaction[]);
    setAllTransactions((balanceTransactionRows ?? []) as Transaction[]);
    setReconciliations((reconciliationRows ?? []) as WalletReconciliation[]);

    const typedPlan = (planRow as MonthlyPlan | null) ?? null;
    setPlan(typedPlan);

    if (typedPlan) {
      const { data: planItemRows, error: planItemsError } = await supabase
        .from("plan_items")
        .select("*")
        .eq("plan_id", typedPlan.id)
        .order("sort_order", { ascending: true });

      if (planItemsError) {
        setError(planItemsError.message);
        setPlanItems([]);
      } else {
        setPlanItems((planItemRows ?? []) as PlanItem[]);
      }
    } else {
      setPlanItems([]);
    }

    setLoading(false);
  }, [planMonthKey, planYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monthTransactions = useMemo(
    () => filterTransactionsForMonth(yearTransactions, planMonthKey),
    [yearTransactions, planMonthKey],
  );

  const monthSummary = useMemo(
    () => summarizeTransactions(monthTransactions),
    [monthTransactions],
  );

  const walletActivity = useMemo(
    () => summarizeTransactionsByWallet(monthTransactions, wallets),
    [monthTransactions, wallets],
  );

  const planComparison = useMemo(
    () =>
      buildPlanComparison({
        categories,
        plan,
        planItems,
        transactions: monthTransactions,
        referenceDate,
      }),
    [categories, plan, planItems, monthTransactions, referenceDate],
  );

  const recentTrend = useMemo(
    () => buildMonthlyTrend(yearTransactions, getRecentMonthKeys(planMonthKey, 6)),
    [yearTransactions, planMonthKey],
  );

  const yearlyOverview = useMemo(
    () => buildYearlyOverview(yearTransactions, planYear),
    [yearTransactions, planYear],
  );

  const portfolioSummary = useMemo(
    () => summarizePortfolioWealth(wallets, allTransactions, investments),
    [wallets, allTransactions, investments],
  );

  const walletBalances = useMemo(
    () => summarizeWalletBalances(wallets, allTransactions, investments),
    [wallets, allTransactions, investments],
  );

  const investmentSummary = useMemo(() => summarizeInvestments(investments), [investments]);

  const profitEntriesTotal = useMemo(
    () =>
      profitEntries.reduce((total, entry) => total + Number(entry.profit_amount), 0),
    [profitEntries],
  );

  return {
    loading,
    error,
    currency,
    planMonthKey,
    setPlanMonthKey,
    monthLabel: month.label,
    planYear,
    monthSummary,
    walletActivity,
    planComparison,
    recentTrend,
    yearlyOverview,
    portfolioSummary,
    walletBalances,
    investmentSummary,
    profitEntries,
    profitEntriesTotal,
    reconciliations,
  };
}
