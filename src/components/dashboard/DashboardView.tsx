import DashboardCards from "@/components/dashboard/DashboardCards";
import DashboardCategoryReport from "@/components/dashboard/DashboardCategoryReport";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import type { DashboardData } from "@/lib/dashboard";

type DashboardViewProps = {
  monthLabel: string;
  data: DashboardData;
};

export default function DashboardView({ monthLabel, data }: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <h1 className="wrap-text text-xl font-semibold text-slate-900 sm:text-3xl">{monthLabel}</h1>

      <DashboardSummary data={data} />

      <DashboardCards data={data} />

      <DashboardCategoryReport data={data} />
    </div>
  );
}
