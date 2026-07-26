"use client";

type PlanStepProps = {
  plannedIncome: string;
  planNotes: string;
  onPlannedIncomeChange: (value: string) => void;
  onPlanNotesChange: (value: string) => void;
};

export default function OnboardingPlanStep({
  plannedIncome,
  planNotes,
  onPlannedIncomeChange,
  onPlanNotesChange,
}: PlanStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">3. خطة الشهر (اختياري)</h2>
      <p className="text-sm text-slate-500">
        حدّد دخل الشهر المتوقع — هنقترح ميزانيات أساسية للفئات الشائعة.
      </p>

      <label className="block space-y-2">
        <span className="text-sm text-slate-600">الدخل المتوقع</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={plannedIncome}
          onChange={(event) => onPlannedIncomeChange(event.target.value)}
          placeholder="مثال: 15000"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-slate-600">ملاحظات</span>
        <input
          type="text"
          value={planNotes}
          onChange={(event) => onPlanNotesChange(event.target.value)}
          placeholder="اختياري"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>
    </div>
  );
}
