import type { PlanOverviewSource } from "@/lib/plan/overview-rates";

export type PlanOverviewPanelProps = PlanOverviewSource & {
  currency: string;
  initialRangeStart: string;
};
