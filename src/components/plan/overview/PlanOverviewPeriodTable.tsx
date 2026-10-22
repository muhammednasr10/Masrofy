"use client";

import type { ReactNode } from "react";
import { periodColumnLabel, type OverviewView } from "@/lib/plan/overview-rates";

export default function PlanOverviewPeriodTable({
  view,
  children,
}: {
  view: OverviewView;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 md:x-scroll md:overflow-x-auto">
      <table className="stack-table w-full text-sm md:min-w-[40rem]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <th className="px-4 py-3 text-right font-medium">{periodColumnLabel(view)}</th>
            <th className="px-4 py-3 text-right font-medium">الدخل</th>
            <th className="px-4 py-3 text-right font-medium">المصروف</th>
            <th className="px-4 py-3 text-right font-medium">الفرق</th>
            <th className="px-4 py-3 text-right font-medium">الفرق التراكمي</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function PlanOverviewEmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      {message}
    </p>
  );
}
