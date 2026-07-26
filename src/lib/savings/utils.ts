import type { SavingsGoal } from "@/lib/types/database";

export function getSavingsGoalProgress(goal: SavingsGoal) {
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);

  if (target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((current / target) * 100));
}

export function getSavingsGoalRemaining(goal: SavingsGoal) {
  return Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
}

export function isSavingsGoalOverdue(goal: SavingsGoal, today = new Date().toISOString().slice(0, 10)) {
  if (!goal.target_date || goal.is_completed) {
    return false;
  }

  return goal.target_date < today && Number(goal.current_amount) < Number(goal.target_amount);
}

export function summarizeSavingsGoals(goals: SavingsGoal[]) {
  const activeGoals = goals.filter((goal) => !goal.is_completed);
  const totalTarget = activeGoals.reduce((sum, goal) => sum + Number(goal.target_amount), 0);
  const totalSaved = activeGoals.reduce((sum, goal) => sum + Number(goal.current_amount), 0);

  return {
    activeCount: activeGoals.length,
    completedCount: goals.length - activeGoals.length,
    totalTarget,
    totalSaved,
    overallProgress: totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0,
  };
}
