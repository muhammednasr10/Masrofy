"use client";

import { useSelectedMonth } from "@/components/month/SelectedMonthProvider";

export function useCurrentMonthRange() {
  return useSelectedMonth().month;
}

export function useMonthPeriod() {
  return useSelectedMonth();
}
