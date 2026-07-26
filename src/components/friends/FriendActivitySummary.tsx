import { getRelationshipLabel } from "@/lib/constants/friendship-options";
import StatCard from "@/components/ui/StatCard";
import type { FriendActivity } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";

type FriendActivitySummaryProps = {
  activity: FriendActivity;
  currency: string;
};

export default function FriendActivitySummary({ activity, currency }: FriendActivitySummaryProps) {
  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">ملخص الشهر</h3>
      <p className="mt-1 text-sm text-slate-500">
        {activity.full_name ?? "مستخدم"} •{" "}
        {getRelationshipLabel(activity.relationship_type, true)}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard
          title="مصروفات"
          value={formatCurrency(Number(activity.month_expenses), currency)}
        />
        <StatCard title="دخل" value={formatCurrency(Number(activity.month_income), currency)} />
        <StatCard title="عمليات" value={String(activity.month_transactions)} />
      </div>
    </section>
  );
}
