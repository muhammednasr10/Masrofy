import DashboardCards from "@/components/dashboard/DashboardCards";
import DashboardCategoryReport from "@/components/dashboard/DashboardCategoryReport";
import DashboardSpendLeft from "@/components/dashboard/DashboardSpendLeft";
import type { DashboardData } from "@/lib/dashboard";

export default function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4">
      <DashboardSpendLeft data={data} />
      <DashboardCards data={data} />
      <DashboardCategoryReport data={data} />
    </div>
  );
}
