import { formatDate, parseLocalDate, formatLocalDate } from "@/lib/calendar/dates";
import { getIntlLocale, type Locale } from "@/i18n/config";
import { addDaysToDateKey, isDateKey } from "@/lib/plan/horizon";
import type { OverviewPeriod, OverviewView } from "@/lib/plan/overview-types";

export function minDateKey(left: string, right: string) {
  return left <= right ? left : right;
}

export function maxDateKey(left: string, right: string) {
  return left >= right ? left : right;
}

export function daysInMonthContaining(dateKey: string) {
  const date = parseLocalDate(dateKey);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function startOfCalendarMonth(dateKey: string) {
  const date = parseLocalDate(dateKey);
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfCalendarMonth(dateKey: string) {
  const date = parseLocalDate(dateKey);
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function startOfCalendarYear(dateKey: string) {
  const date = parseLocalDate(dateKey);
  return formatLocalDate(new Date(date.getFullYear(), 0, 1));
}

function endOfCalendarYear(dateKey: string) {
  const date = parseLocalDate(dateKey);
  return formatLocalDate(new Date(date.getFullYear(), 11, 31));
}

function formatMonthLabel(dateKey: string, locale: Locale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: "long",
    year: "numeric",
  }).format(parseLocalDate(dateKey));
}

function formatYearLabel(dateKey: string, locale: Locale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: "numeric",
  }).format(parseLocalDate(dateKey));
}

function formatWeekLabel(start: string, end: string, locale: Locale) {
  return `${formatDate(start, locale)} – ${formatDate(end, locale)}`;
}

export function enumerateOverviewPeriods(
  view: OverviewView,
  rangeStart: string,
  rangeEnd: string,
  locale: Locale = "ar",
): OverviewPeriod[] {
  if (!isDateKey(rangeStart) || !isDateKey(rangeEnd) || rangeEnd < rangeStart) {
    return [];
  }

  const periods: OverviewPeriod[] = [];

  if (view === "daily") {
    let cursor = rangeStart;

    while (cursor <= rangeEnd && periods.length < 400) {
      periods.push({
        start: cursor,
        end: cursor,
        label: formatDate(cursor, locale),
      });
      cursor = addDaysToDateKey(cursor, 1);
    }

    return periods;
  }

  if (view === "weekly") {
    let cursor = rangeStart;

    while (cursor <= rangeEnd && periods.length < 120) {
      const weekEnd = minDateKey(addDaysToDateKey(cursor, 6), rangeEnd);
      periods.push({
        start: cursor,
        end: weekEnd,
        label: formatWeekLabel(cursor, weekEnd, locale),
      });
      cursor = addDaysToDateKey(weekEnd, 1);
    }

    return periods;
  }

  if (view === "monthly") {
    let cursor = startOfCalendarMonth(rangeStart);

    while (cursor <= rangeEnd && periods.length < 120) {
      const monthEnd = endOfCalendarMonth(cursor);
      const start = maxDateKey(cursor, rangeStart);
      const end = minDateKey(monthEnd, rangeEnd);

      if (start <= end) {
        periods.push({
          start,
          end,
          label: formatMonthLabel(cursor, locale),
        });
      }

      cursor = addDaysToDateKey(monthEnd, 1);
    }

    return periods;
  }

  let cursor = startOfCalendarYear(rangeStart);

  while (cursor <= rangeEnd && periods.length < 40) {
    const yearEnd = endOfCalendarYear(cursor);
    const start = maxDateKey(cursor, rangeStart);
    const end = minDateKey(yearEnd, rangeEnd);

    if (start <= end) {
      periods.push({
        start,
        end,
        label: formatYearLabel(cursor, locale),
      });
    }

    cursor = addDaysToDateKey(yearEnd, 1);
  }

  return periods;
}
