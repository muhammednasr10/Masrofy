import { getCategoryFlow } from "@/lib/categories/flow";
import { isDateKey, isOpenEndedDate, type HorizonLineDraft } from "@/lib/plan/horizon";
import { isHorizonRollupParent } from "@/lib/plan/horizon-rollup";
import type { Category, CategoryFlow } from "@/lib/types/database";

const ANSWERS_KEY = "masrofy-plan-due-answers";

export type DuePlanLine = {
  answerId: string;
  categoryId: string;
  name: string;
  amount: number;
  flow: CategoryFlow;
  dueDate: string;
  walletId: string | null;
};

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseExpectedDay(value: string | number | null | undefined) {
  const day = Number(String(value ?? "").trim());

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return null;
  }

  return day;
}

/** The date this month when the planned day falls, clamped to the last day of the month. */
export function expectedDateThisMonth(today: Date, expectedDay: number) {
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const day = Math.min(expectedDay, lastDay);
  return formatDateKey(new Date(today.getFullYear(), today.getMonth(), day));
}

export function planDueAnswerId(dueDate: string, categoryId: string) {
  return `${dueDate.slice(0, 7)}:${categoryId}`;
}

export function isExpectedDayDue(input: {
  expectedDay: number | null;
  startDate: string;
  endDate: string;
  today?: Date;
}) {
  if (input.expectedDay == null || !isDateKey(input.startDate)) {
    return null;
  }

  if (!isOpenEndedDate(input.endDate) && input.endDate < input.startDate) {
    return null;
  }

  const today = input.today ?? new Date();
  const dueDate = expectedDateThisMonth(today, input.expectedDay);
  const todayKey = formatDateKey(today);

  if (dueDate > todayKey || dueDate < input.startDate) {
    return null;
  }

  if (!isOpenEndedDate(input.endDate) && dueDate > input.endDate) {
    return null;
  }

  return dueDate;
}

export function readPlanDueAnswers(): Record<string, "yes" | "no"> {
  if (typeof localStorage === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(ANSWERS_KEY) ?? "{}") as Record<string, string>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, "yes" | "no"] => {
        return entry[1] === "yes" || entry[1] === "no";
      }),
    );
  } catch {
    return {};
  }
}

export function collectDuePlanLines(
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
  today: Date,
  answered: Record<string, "yes" | "no">,
): DuePlanLine[] {
  return categories.flatMap((category) => {
    const line = lines[category.id];
    const amount = Number(line?.amount || 0);

    if (!line || amount <= 0 || isHorizonRollupParent(category.id, categories, lines)) {
      return [];
    }

    const dueDate = isExpectedDayDue({
      expectedDay: parseExpectedDay(line.expectedDay),
      startDate: line.startDate,
      endDate: line.endDate,
      today,
    });

    if (!dueDate) {
      return [];
    }

    const answerId = planDueAnswerId(dueDate, category.id);

    if (answered[answerId]) {
      return [];
    }

    return [
      {
        answerId,
        categoryId: category.id,
        name: category.name,
        amount,
        flow: getCategoryFlow(category),
        dueDate,
        walletId: line.walletId || null,
      },
    ];
  });
}

export function writePlanDueAnswer(id: string, answer: "yes" | "no") {
  const next = { ...readPlanDueAnswers(), [id]: answer };
  localStorage.setItem(ANSWERS_KEY, JSON.stringify(next));
  return next;
}
