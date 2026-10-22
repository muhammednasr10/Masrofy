"use client";

import { useState } from "react";
import {
  defaultOverviewRangeEnd,
  isOverviewRangeReady,
  type OverviewView,
} from "@/lib/plan/overview-rates";

export function usePlanOverviewRange(initialRangeStart: string) {
  const [view, setView] = useState<OverviewView>("monthly");
  const [rangeStart, setRangeStart] = useState(initialRangeStart);
  const [rangeEnd, setRangeEnd] = useState(() => defaultOverviewRangeEnd(initialRangeStart));

  return {
    view,
    setView,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    rangeReady: isOverviewRangeReady(rangeStart, rangeEnd),
  };
}
