import Link from "next/link";
import type { DashboardAlert } from "@/lib/alerts/dashboard";

const toneClasses = {
  red: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
  amber: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
};

export default function DashboardAlerts({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">تنبيهات ({alerts.length})</h2>
        <p className="mt-1 text-sm text-slate-500">أمور تحتاج انتباهك هذا الشهر.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            href={alert.href}
            className={`inline-flex max-w-full items-start gap-2 rounded-2xl border px-4 py-3 transition ${toneClasses[alert.tone]}`}
          >
            <span className="text-lg">{alert.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{alert.title}</span>
              <span className="block text-xs opacity-80">{alert.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
