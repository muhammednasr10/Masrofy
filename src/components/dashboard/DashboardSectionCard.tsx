"use client";

import Link from "@/components/router/Link";

export type DashboardSectionCardProps = {
  href: string;
  icon: string;
  title: string;
  description: string;
  primaryValue: string;
  secondaryValue?: string;
  tone?: "emerald" | "red" | "indigo" | "amber" | "slate" | "sky";
  className?: string;
};

const toneClasses = {
  emerald: "from-emerald-50 to-white hover:border-emerald-200",
  red: "from-red-50 to-white hover:border-red-200",
  indigo: "from-indigo-50 to-white hover:border-indigo-200",
  amber: "from-amber-50 to-white hover:border-amber-200",
  slate: "from-slate-100 to-white hover:border-slate-300",
  sky: "from-sky-50 to-white hover:border-sky-200",
};

export default function DashboardSectionCard({
  href,
  icon,
  title,
  primaryValue,
  secondaryValue,
  tone = "emerald",
  className = "",
}: DashboardSectionCardProps) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl border border-white bg-gradient-to-br ${toneClasses[tone]} px-3 py-2.5 shadow-sm transition hover:shadow-md ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 text-lg">
          {icon}
        </span>
        <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mt-1.5 text-base font-semibold leading-6 text-slate-900">{primaryValue}</p>
      {secondaryValue ? (
        <p className="mt-0.5 truncate text-xs text-slate-500">{secondaryValue}</p>
      ) : null}
    </Link>
  );
}
