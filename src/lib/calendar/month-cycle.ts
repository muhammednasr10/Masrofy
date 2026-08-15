import { defaultLocale, getIntlLocale, type Locale } from "@/i18n/config";
import { formatDate, formatLocalDate, startOfLocalDay } from "@/lib/calendar/dates";

export const MONTH_START_DAY_MIN = 1;
export const MONTH_START_DAY_MAX = 28;
export const MONTH_START_DAYS = Array.from(
  { length: MONTH_START_DAY_MAX },
  (_, index) => index + MONTH_START_DAY_MIN,
);

export type MonthRange = {
  start: string;
  end: string;
  label: string;
};

export function normalizeMonthStartDay(value: unknown) {
  const day = Number(value);

  if (!Number.isInteger(day) || day < MONTH_START_DAY_MIN) {
    return MONTH_START_DAY_MIN;
  }

  return Math.min(day, MONTH_START_DAY_MAX);
}

function dateWithClampedDay(year: number, monthIndex: number, day: number) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

function periodStartOnOrBefore(reference: Date, startDay: number) {
  if (startDay === 1) {
    return new Date(reference.getFullYear(), reference.getMonth(), 1);
  }

  const startThisMonth = dateWithClampedDay(
    reference.getFullYear(),
    reference.getMonth(),
    startDay,
  );

  if (reference >= startThisMonth) {
    return startThisMonth;
  }

  return dateWithClampedDay(reference.getFullYear(), reference.getMonth() - 1, startDay);
}

function nextPeriodStart(start: Date, startDay: number) {
  if (startDay === 1) {
    return new Date(start.getFullYear(), start.getMonth() + 1, 1);
  }

  return dateWithClampedDay(start.getFullYear(), start.getMonth() + 1, startDay);
}

function formatMonthRangeLabel(startKey: string, endKey: string, startDay: number, locale: Locale, reference: Date) {
  if (startDay === 1) {
    return new Intl.DateTimeFormat(getIntlLocale(locale), {
      month: "long",
      year: "numeric",
    }).format(reference);
  }

  return `${formatDate(startKey, locale)} – ${formatDate(endKey, locale)}`;
}

export function getMonthRange(
  referenceDate = new Date(),
  locale: Locale = defaultLocale,
  monthStartDay: unknown = 1,
): MonthRange {
  const startDay = normalizeMonthStartDay(monthStartDay);
  const reference = startOfLocalDay(referenceDate);
  const start = periodStartOnOrBefore(reference, startDay);
  const end = nextPeriodStart(start, startDay);
  end.setDate(end.getDate() - 1);

  const startKey = formatLocalDate(start);
  const endKey = formatLocalDate(end);

  return {
    start: startKey,
    end: endKey,
    label: formatMonthRangeLabel(startKey, endKey, startDay, locale, reference),
  };
}

export function isDateInMonthRange(date: string, range: Pick<MonthRange, "start" | "end">) {
  return date >= range.start && date <= range.end;
}

export function getPlanMonthKey(referenceDate = new Date(), monthStartDay: unknown = 1) {
  return getMonthRange(referenceDate, "en", monthStartDay).start.slice(0, 7);
}

export function parsePlanMonthKey(planMonthKey: string, monthStartDay: unknown = 1) {
  const [year, month] = planMonthKey.split("-").map(Number);
  return dateWithClampedDay(year, month - 1, normalizeMonthStartDay(monthStartDay));
}

export function shiftPlanMonthKey(
  planMonthKey: string,
  offset: number,
  monthStartDay: unknown = 1,
) {
  const date = parsePlanMonthKey(planMonthKey, monthStartDay);
  date.setMonth(date.getMonth() + offset);
  return getPlanMonthKey(date, monthStartDay);
}

export function getMonthStartFromPlanMonthKey(
  planMonthKey: string,
  monthStartDay: unknown = 1,
) {
  return getMonthRange(parsePlanMonthKey(planMonthKey, monthStartDay), "en", monthStartDay).start;
}

export function getPlanYear(planMonthKey: string, monthStartDay: unknown = 1) {
  return parsePlanMonthKey(planMonthKey, monthStartDay).getFullYear();
}

export function getYearMonthKeys(year: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
}
