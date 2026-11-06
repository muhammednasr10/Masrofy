"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

const STORAGE_KEY = "masrofy:dashboard-balances-visible";
export const BALANCE_MASK = "••••••";

type DashboardBalanceVisibilityContextValue = {
  balancesVisible: boolean;
  toggleBalances: () => void;
  maskBalance: (value: string, sensitive?: boolean) => string;
};

const DashboardBalanceVisibilityContext =
  createContext<DashboardBalanceVisibilityContextValue | null>(null);

export function DashboardBalanceVisibilityProvider({ children }: { children: ReactNode }) {
  const [balancesVisible, setBalancesVisible] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === "true") {
      setBalancesVisible(true);
    }
  }, []);

  const toggleBalances = useCallback(() => {
    setBalancesVisible((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const maskBalance = useCallback(
    (value: string, sensitive = true) => {
      if (!sensitive || balancesVisible) {
        return value;
      }

      return BALANCE_MASK;
    },
    [balancesVisible],
  );

  const value = useMemo(
    () => ({
      balancesVisible,
      toggleBalances,
      maskBalance,
    }),
    [balancesVisible, toggleBalances, maskBalance],
  );

  return (
    <DashboardBalanceVisibilityContext.Provider value={value}>
      {children}
    </DashboardBalanceVisibilityContext.Provider>
  );
}

export function useDashboardBalanceVisibility() {
  const context = useContext(DashboardBalanceVisibilityContext);

  if (!context) {
    throw new Error(
      "useDashboardBalanceVisibility must be used within DashboardBalanceVisibilityProvider",
    );
  }

  return context;
}

export function DashboardBalanceToggleButton() {
  const t = useTranslations();
  const { balancesVisible, toggleBalances } = useDashboardBalanceVisibility();

  const label = balancesVisible ? t("dashboard.hideBalances") : t("dashboard.showBalances");

  return (
    <button
      type="button"
      onClick={toggleBalances}
      aria-label={label}
      aria-pressed={balancesVisible}
      title={label}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-base text-slate-700 transition hover:bg-slate-50"
    >
      <span aria-hidden>{balancesVisible ? "🙈" : "👁️"}</span>
    </button>
  );
}
