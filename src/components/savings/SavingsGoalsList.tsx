"use client";

import type { SavingsGoal } from "@/lib/types/database";
import {
  getSavingsGoalProgress,
  getSavingsGoalRemaining,
  isSavingsGoalOverdue,
} from "@/lib/savings/utils";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type SavingsGoalsListProps = {
  goals: SavingsGoal[];
  currency: string;
  onEdit: (goal: SavingsGoal) => void;
  onAddContribution: (goal: SavingsGoal) => void;
  onDelete: (goalId: string) => void;
};

export default function SavingsGoalsList({
  goals,
  currency,
  onEdit,
  onAddContribution,
  onDelete,
}: SavingsGoalsListProps) {
  if (goals.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">ابدأ بإضافة أول هدف ادّخار.</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {goals.map((goal) => {
        const progress = getSavingsGoalProgress(goal);
        const remaining = getSavingsGoalRemaining(goal);
        const overdue = isSavingsGoalOverdue(goal);

        return (
          <li
            key={goal.id}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            style={{ borderColor: `${goal.color}33` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {goal.icon} {goal.name}
                  {goal.is_completed ? (
                    <span className="mr-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                      مكتمل
                    </span>
                  ) : null}
                  {overdue ? (
                    <span className="mr-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      متأخر
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatCurrency(Number(goal.current_amount), currency)} من{" "}
                  {formatCurrency(Number(goal.target_amount), currency)}
                  {goal.target_date ? ` • حتى ${formatDate(goal.target_date)}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold" style={{ color: goal.color }}>
                {progress}%
              </p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: goal.color }}
              />
            </div>

            {!goal.is_completed ? (
              <p className="mt-2 text-xs text-slate-500">
                متبقي {formatCurrency(remaining, currency)}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {!goal.is_completed ? (
                <button
                  type="button"
                  onClick={() => onAddContribution(goal)}
                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                >
                  + إيداع
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onEdit(goal)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                تعديل
              </button>
              <button
                type="button"
                onClick={() => onDelete(goal.id)}
                className="rounded-full px-3 py-1.5 text-xs text-slate-500 transition hover:bg-white hover:text-red-600"
              >
                حذف
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
