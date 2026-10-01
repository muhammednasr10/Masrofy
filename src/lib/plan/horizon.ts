export const HORIZON_CADENCES = ["daily", "weekly", "monthly", "yearly"] as const;

export type HorizonCadence = (typeof HORIZON_CADENCES)[number];

export function isHorizonCadence(value: string): value is HorizonCadence {
  return (HORIZON_CADENCES as readonly string[]).includes(value);
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

export function daysInclusive(start: string, end: string) {
  if (end < start) {
    return 0;
  }

  const ms = parseDateKey(end).getTime() - parseDateKey(start).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

function dateOnMonthOffset(anchor: string, monthOffset: number) {
  const [year, month, day] = anchor.split("-").map(Number);
  const monthStart = new Date(year, month - 1 + monthOffset, 1);
  const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();

  if (day > lastDay) {
    return null;
  }

  return formatDateKey(new Date(monthStart.getFullYear(), monthStart.getMonth(), day));
}

function countWeekly(anchor: string, planEnd: string, windowStart: string, windowEnd: string) {
  const first = windowStart > anchor ? windowStart : anchor;
  const last = windowEnd < planEnd ? windowEnd : planEnd;

  if (last < first) {
    return 0;
  }

  const fromAnchor = daysInclusive(anchor, first) - 1;
  const remainder = fromAnchor % 7;
  const offset = remainder === 0 ? 0 : 7 - remainder;
  const firstHit = addDaysToDateKey(first, offset);

  if (firstHit > last) {
    return 0;
  }

  return Math.floor((daysInclusive(firstHit, last) - 1) / 7) + 1;
}

function countCalendarStep(
  anchor: string,
  planEnd: string,
  windowStart: string,
  windowEnd: string,
  step: "monthly" | "yearly",
) {
  const last = windowEnd < planEnd ? windowEnd : planEnd;
  let count = 0;

  for (let index = 0; index < 600; index += 1) {
    const date = dateOnMonthOffset(anchor, step === "yearly" ? index * 12 : index);

    if (date && date > last) {
      break;
    }

    if (!date) {
      continue;
    }

    if (date >= windowStart && date <= last && date <= planEnd) {
      count += 1;
    }
  }

  return count;
}

export function occurrenceCount(
  cadence: HorizonCadence,
  planStart: string,
  planEnd: string,
  windowStart = planStart,
  windowEnd = planEnd,
) {
  if (planEnd < planStart || windowEnd < windowStart) {
    return 0;
  }

  const start = windowStart > planStart ? windowStart : planStart;
  const end = windowEnd < planEnd ? windowEnd : planEnd;

  if (end < start) {
    return 0;
  }

  if (cadence === "daily") {
    return daysInclusive(start, end);
  }

  if (cadence === "weekly") {
    return countWeekly(planStart, planEnd, start, end);
  }

  if (cadence === "monthly") {
    return countCalendarStep(planStart, planEnd, start, end, "monthly");
  }

  return countCalendarStep(planStart, planEnd, start, end, "yearly");
}

export type HorizonExpenseLine = {
  amount: number;
  cadence: HorizonCadence;
  startDate: string;
  endDate: string;
};

export type HorizonLineDraft = {
  amount: string;
  cadence: HorizonCadence;
  startDate: string;
  endDate: string;
};

export function emptyHorizonLine(startDate: string): HorizonLineDraft {
  return {
    amount: "",
    cadence: "monthly",
    startDate,
    endDate: defaultHorizonEndDate(startDate),
  };
}

export function sumHorizonExpenses(
  lines: HorizonExpenseLine[],
  windowStart?: string,
  windowEnd?: string,
) {
  return lines.reduce((total, line) => {
    if (line.amount <= 0 || line.endDate < line.startDate) {
      return total;
    }

    return (
      total +
      line.amount *
        occurrenceCount(
          line.cadence,
          line.startDate,
          line.endDate,
          windowStart ?? line.startDate,
          windowEnd ?? line.endDate,
        )
    );
  }, 0);
}

export function defaultHorizonEndDate(start: string) {
  const nextYear = dateOnMonthOffset(start, 12) ?? addDaysToDateKey(start, 365);
  return addDaysToDateKey(nextYear, -1);
}

export function horizonOverlapsRange(
  planStart: string,
  planEnd: string,
  rangeStart: string,
  rangeEnd: string,
) {
  return planStart <= rangeEnd && planEnd >= rangeStart;
}
